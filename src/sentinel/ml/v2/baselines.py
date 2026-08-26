from abc import ABC, abstractmethod

from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression as SKLogisticRegression


@dataclass
class BaselineResult:
    symbol: str
    baseline_name: str
    target_column: str
    horizon: int
    window_size: int | None
    metric_name: str
    metric_value: float


class BaseBaseline(ABC):

    @abstractmethod
    def fit(self, y: pd.Series) -> None:
        ...

    @abstractmethod
    def predict(self, y: pd.Series) -> float:
        ...

    @abstractmethod
    def predict_batch(self, y: pd.Series) -> pd.Series:
        ...


class NaiveBaseline(BaseBaseline):

    def __init__(self, target_type: str) -> None:
        self.target_type = target_type
        self.majority_class: int | None = None

    def fit(self, y: pd.Series) -> None:
        if self.target_type == "direction":
            self.majority_class = int(y.mode().iloc[0])

    def predict(self, y: pd.Series) -> float:
        if self.target_type == "return":
            return 0.0
        elif self.target_type == "direction":
            return float(self.majority_class) if self.majority_class is not None else 0.0
        elif self.target_type == "volatility":
            return float(y.iloc[-1])
        return 0.0

    def predict_batch(self, y: pd.Series) -> pd.Series:
        if self.target_type == "return":
            return pd.Series(0.0, index=y.index)
        elif self.target_type == "direction":
            return pd.Series(self.majority_class, index=y.index)
        elif self.target_type == "volatility":
            return y.shift(1)
        return pd.Series(0.0, index=y.index)


class HistoricalMeanBaseline(BaseBaseline):

    def __init__(self, window_size: int) -> None:
        self.window_size = window_size

    def fit(self, y: pd.Series) -> None:
        pass

    def predict(self, y: pd.Series) -> float:
        return float(y.iloc[-self.window_size:].mean())

    def predict_batch(self, y: pd.Series) -> pd.Series:
        return y.rolling(self.window_size).mean()


class HistoricalVolatilityBaseline(BaseBaseline):

    def __init__(self, window_size: int) -> None:
        self.window_size = window_size

    def fit(self, y: pd.Series) -> None:
        pass

    def predict(self, y: pd.Series) -> float:
        return float(y.iloc[-self.window_size:].std())

    def predict_batch(self, y: pd.Series) -> pd.Series:
        return y.rolling(self.window_size).std()


class AR1Baseline(BaseBaseline):

    def __init__(self) -> None:
        self.coef: float | None = None
        self.intercept: float | None = None

    def fit(self, y: pd.Series) -> None:
        x = y.iloc[:-1].values
        y_target = y.iloc[1:].values

        x_mean = x.mean()
        y_mean = y_target.mean()

        numerator = ((x - x_mean) * (y_target - y_mean)).sum()
        denominator = ((x - x_mean) ** 2).sum()

        if denominator == 0:
            self.coef = 0.0
            self.intercept = y_mean
            return

        self.coef = float(numerator / denominator)
        self.intercept = float(y_mean - self.coef * x_mean)

    def predict(self, y: pd.Series) -> float:
        return self.intercept + self.coef * y.iloc[-1]

    def predict_batch(self, y: pd.Series) -> pd.Series:
        shifted = y.shift(1)
        return self.intercept + self.coef * shifted


class LinearRegressionBaseline(BaseBaseline):

    def __init__(self, feature_columns: list[str]) -> None:
        self.feature_columns = feature_columns
        self.coef: np.ndarray | None = None
        self.intercept: float | None = None

    def fit(self, y: pd.Series, X: pd.DataFrame) -> None:
        X_mat = X[self.feature_columns].values
        y_vec = y.values

        X_with_intercept = np.column_stack([np.ones(len(X_mat)), X_mat])
        params, _, _, _ = np.linalg.lstsq(X_with_intercept, y_vec, rcond=None)

        self.intercept = float(params[0])
        self.coef = params[1:]

    def predict(self, y: pd.Series, X: pd.DataFrame) -> float:
        X_last = X[self.feature_columns].iloc[-1].values
        return float(X_last @ self.coef + self.intercept)

    def predict_batch(self, y: pd.Series, X: pd.DataFrame) -> pd.Series:
        X_mat = X[self.feature_columns].values
        predictions = X_mat @ self.coef + self.intercept
        return pd.Series(predictions, index=X.index)


class LogisticRegressionBaseline(BaseBaseline):

    def __init__(self, feature_columns: list[str]) -> None:
        self.feature_columns = feature_columns
        self.model: SKLogisticRegression | None = None

    def fit(self, y: pd.Series, X: pd.DataFrame) -> None:
        X_mat = X[self.feature_columns].values
        y_vec = y.values.astype(int)

        self.model = SKLogisticRegression(
            max_iter=1000,
            solver="lbfgs",
            random_state=42,
        )
        self.model.fit(X_mat, y_vec)

    def predict(self, y: pd.Series, X: pd.DataFrame) -> float:
        X_last = X[self.feature_columns].iloc[-1].values.reshape(1, -1)
        return float(self.model.predict_proba(X_last)[0, 1])

    def predict_batch(self, y: pd.Series, X: pd.DataFrame) -> pd.Series:
        X_mat = X[self.feature_columns].values
        probabilities = self.model.predict_proba(X_mat)[:, 1]
        return pd.Series(probabilities, index=X.index)


FEATURE_COLUMNS = ["ret_1b", "vol_20", "rsi_14", "volume_rel_20", "dist_sma_20"]


def _build_baselines(
    target_type: str,
) -> list[tuple[str, BaseBaseline]]:
    baselines: list[tuple[str, BaseBaseline]] = [
        ("naive", NaiveBaseline(target_type)),
    ]

    if target_type == "volatility":
        for window in [20, 60, 168]:
            baselines.append(
                (f"historical_volatility_{window}", HistoricalVolatilityBaseline(window))
            )
    else:
        for window in [20, 60, 168]:
            baselines.append(
                (f"historical_mean_{window}", HistoricalMeanBaseline(window))
            )

    if target_type == "return":
        baselines.append(("ar1", AR1Baseline()))
        baselines.append(
            ("linear_regression", LinearRegressionBaseline(FEATURE_COLUMNS))
        )
    elif target_type == "direction":
        baselines.append(
            ("logistic_regression", LogisticRegressionBaseline(FEATURE_COLUMNS))
        )

    return baselines


def _evaluate_walk_forward(
    y: pd.Series,
    X: pd.DataFrame | None,
    baseline: BaseBaseline,
    min_train_size: int = 500,
) -> dict[str, float]:
    predictions = []
    actuals = []

    for i in range(min_train_size, len(y)):
        train_y = y.iloc[:i]
        test_y = y.iloc[i]

        if X is not None:
            train_X = X.iloc[:i]
            test_X = X.iloc[[i]]
            baseline.fit(train_y, train_X)
            pred = baseline.predict(train_y, test_X)
        else:
            baseline.fit(train_y)
            pred = baseline.predict(train_y)

        predictions.append(pred)
        actuals.append(test_y)

    predictions = np.array(predictions)
    actuals = np.array(actuals)

    mae = float(np.mean(np.abs(actuals - predictions)))
    rmse = float(np.sqrt(np.mean((actuals - predictions) ** 2)))

    ss_res = np.sum((actuals - predictions) ** 2)
    ss_tot = np.sum((actuals - actuals.mean()) ** 2)
    r2 = float(1 - ss_res / ss_tot) if ss_tot > 0 else 0.0

    if set(np.unique(actuals)).issubset({0, 1}):
        dir_acc = float(np.mean((predictions > 0.5).astype(int) == actuals))
    else:
        dir_acc = float(np.mean(np.sign(predictions) == np.sign(actuals)))

    return {"mae": mae, "rmse": rmse, "r2": r2, "directional_accuracy": dir_acc}


def run_baselines(symbols: list[str]) -> list[BaselineResult]:
    from sentinel.database.connection import engine

    results: list[BaselineResult] = []

    target_configs = [
        ("target_return_1h", "return", 1),
        ("target_return_4h", "return", 4),
        ("target_return_12h", "return", 12),
        ("target_return_24h", "return", 24),
        ("target_return_72h", "return", 72),
        ("target_direction_1h", "direction", 1),
        ("target_direction_4h", "direction", 4),
        ("target_direction_12h", "direction", 12),
        ("target_direction_24h", "direction", 24),
        ("target_direction_72h", "direction", 72),
        ("target_volatility_4h", "volatility", 4),
        ("target_volatility_24h", "volatility", 24),
        ("target_volatility_72h", "volatility", 72),
    ]

    query = """
        SELECT *
        FROM market_features
        WHERE symbol = :symbol
        ORDER BY date_time ASC
    """

    with engine.connect() as conn:
        for symbol in symbols:
            df = pd.read_sql(sql=query, con=conn, params={"symbol": symbol})

            if df.empty:
                continue

            for target_col, target_type, horizon in target_configs:
                if target_col not in df.columns:
                    continue

                y = df[target_col].dropna()
                if len(y) < 600:
                    continue

                X = df.loc[y.index]

                baselines = _build_baselines(target_type)

                for baseline_name, baseline in baselines:
                    try:
                        if isinstance(baseline, (LinearRegressionBaseline, LogisticRegressionBaseline)):
                            metrics = _evaluate_walk_forward(y, X, baseline)
                        else:
                            metrics = _evaluate_walk_forward(y, None, baseline)

                        for metric_name, metric_value in metrics.items():
                            window = getattr(baseline, "window_size", None)
                            results.append(
                                BaselineResult(
                                    symbol=symbol,
                                    baseline_name=baseline_name,
                                    target_column=target_col,
                                    horizon=horizon,
                                    window_size=window,
                                    metric_name=metric_name,
                                    metric_value=metric_value,
                                )
                            )
                    except Exception as e:
                        print(f"Error evaluating {baseline_name} on {symbol}/{target_col}: {e}")

    return results


def _print_results(results: list[BaselineResult]) -> None:
    if not results:
        print("No results to display.")
        return

    df = pd.DataFrame([r.__dict__ for r in results])

    symbols = df["symbol"].unique()

    for symbol in symbols:
        print(f"\n{'=' * 80}")
        print(f"Symbol: {symbol}")
        print(f"{'=' * 80}")

        symbol_df = df[df["symbol"] == symbol]
        targets = symbol_df["target_column"].unique()

        for target in targets:
            target_df = symbol_df[symbol_df["target_column"] == target]
            print(f"\n  Target: {target}")

            pivot = target_df.pivot_table(
                index=["baseline_name", "window_size"],
                columns="metric_name",
                values="metric_value",
                aggfunc="first",
            ).reset_index()

            pivot = pivot.sort_values("mae")

            print(f"  {'Baseline':<30} {'Window':>6} {'MAE':>10} {'RMSE':>10} {'R2':>10} {'DirAcc':>10}")
            print(f"  {'-' * 30} {'-' * 6} {'-' * 10} {'-' * 10} {'-' * 10} {'-' * 10}")

            for _, row in pivot.iterrows():
                name = row["baseline_name"]
                window = row["window_size"] if pd.notna(row["window_size"]) else "-"
                mae = row.get("mae", 0)
                rmse = row.get("rmse", 0)
                r2 = row.get("r2", 0)
                dir_acc = row.get("directional_accuracy", 0)

                print(
                    f"  {name:<30} {str(window):>6} "
                    f"{mae:>10.6f} {rmse:>10.6f} {r2:>10.6f} {dir_acc:>9.2%}"
                )
