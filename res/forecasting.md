# Forecasting

## Target Engineering

### Forecsting Objectives

- predict target returns
- predict target direction
- predict target volatility
- predict target log returns

### Prediction Horizons

- 1 hr
- 4 hr
- 12 hr
- 24 hr
- 72 hr

### Return targets

- target_return_1h
- target_return_4h
- target_return_12h
- target_return_24h
- target_return_72h 

### Direction targets

- target_direction_1h
- target_direction_4h
- target_direction_12h
- target_direction_24h
- target_direction_72h

### Volatility targets

- target_volatility_4h
- target_volatility_24h
- target_volatility_72h

### Log Targets

- target_log_return_1h
- target_log_return_4h
- target_log_return_12h
- target_log_return_24h
- target_log_return_72h

### Target Distribution Statistics

| feature | total_rows | valid_rows | null_rows | nan_rows | inf_rows | mean | std | min | p01 | p05 | p25 | median | p75 | p95 | p99 | max | zero_count |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| target_return_1h | 350400 | 350380 | 20 | 20 | 0 | 0.000009 | 0.009139 | -0.266591 | -0.025712 | -0.013235 | -0.003842 | 0.000000 | 0.003799 | 0.013286 | 0.026212 | 0.336063 | 3318 |
| target_return_4h | 350400 | 350320 | 80 | 80 | 0 | 0.000034 | 0.018158 | -0.331666 | -0.049991 | -0.026646 | -0.007774 | -0.000051 | 0.007539 | 0.026810 | 0.051996 | 0.575859 | 1718 |
| target_return_12h | 350400 | 350160 | 240 | 240 | 0 | 0.000105 | 0.031478 | -0.367409 | -0.081567 | -0.046407 | -0.014885 | -0.000306 | 0.013876 | 0.047692 | 0.093891 | 0.805749 | 896 |
| target_return_24h | 350400 | 349920 | 480 | 480 | 0 | 0.000233 | 0.044748 | -0.351143 | -0.112977 | -0.064482 | -0.022219 | -0.000737 | 0.019665 | 0.070249 | 0.133042 | 0.958213 | 614 |
| target_return_72h | 350400 | 348960 | 1440 | 1440 | 0 | 0.000911 | 0.078345 | -0.387745 | -0.177650 | -0.113582 | -0.040801 | -0.002362 | 0.035106 | 0.125049 | 0.247767 | 1.346397 | 326 |
| target_volatility_4h | 350400 | 350320 | 80 | 80 | 0 | 0.007050 | 0.005864 | 0.000005 | 0.000722 | 0.001410 | 0.003294 | 0.005558 | 0.008974 | 0.017701 | 0.028051 | 0.171540 | 0 |
| target_volatility_24h | 350400 | 349920 | 480 | 480 | 0 | 0.007862 | 0.004683 | 0.000529 | 0.001494 | 0.002492 | 0.004833 | 0.006951 | 0.009731 | 0.016076 | 0.023573 | 0.076209 | 0 |
| target_volatility_72h | 350400 | 348960 | 1440 | 1440 | 0 | 0.008138 | 0.004182 | 0.000830 | 0.001801 | 0.002977 | 0.005425 | 0.007448 | 0.009870 | 0.015715 | 0.022930 | 0.049869 | 0 |
| target_log_return_1h | 350400 | 350380 | 20 | 20 | 0 | -0.000033 | 0.009143 | -0.310052 | -0.026048 | -0.013323 | -0.003849 | 0.000000 | 0.003792 | 0.013198 | 0.025874 | 0.289727 | 3318 |
| target_log_return_4h | 350400 | 350320 | 80 | 80 | 0 | -0.000131 | 0.018125 | -0.402967 | -0.051284 | -0.027008 | -0.007805 | -0.000051 | 0.007511 | 0.026457 | 0.050689 | 0.454801 | 1718 |
| target_log_return_12h | 350400 | 350160 | 240 | 240 | 0 | -0.000386 | 0.031279 | -0.457932 | -0.085086 | -0.047518 | -0.014996 | -0.000306 | 0.013780 | 0.046590 | 0.089741 | 0.590975 | 896 |
| target_log_return_24h | 350400 | 349920 | 480 | 480 | 0 | -0.000751 | 0.044235 | -0.432543 | -0.119884 | -0.066655 | -0.022469 | -0.000737 | 0.019474 | 0.067892 | 0.124906 | 0.672032 | 614 |
| target_log_return_72h | 350400 | 348960 | 1440 | 1440 | 0 | -0.002019 | 0.075955 | -0.490607 | -0.195589 | -0.120567 | -0.041657 | -0.002365 | 0.034504 | 0.117827 | 0.221356 | 0.852881 | 326 |

### Target imbalance analysis

| target | class | count | percentage | majority_class | majority_count | minority_class | minority_count | imbalance_ratio |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| target_direction_1h | 0 | 177240 | 50.582192 | 0 | 177240 | 1 | 173160 | 1.023562 |
| target_direction_1h | 1 | 173160 | 49.417808 | 0 | 177240 | 1 | 173160 | 1.023562 |
| target_direction_4h | 0 | 177235 | 50.580765 | 0 | 177235 | 1 | 173165 | 1.023504 |
| target_direction_4h | 1 | 173165 | 49.419235 | 0 | 177235 | 1 | 173165 | 1.023504 |
| target_direction_12h | 0 | 178020 | 50.804795 | 0 | 178020 | 1 | 172380 | 1.032718 |
| target_direction_12h | 1 | 172380 | 49.195205 | 0 | 178020 | 1 | 172380 | 1.032718 |
| target_direction_24h | 0 | 179494 | 51.225457 | 0 | 179494 | 1 | 170906 | 1.050250 |
| target_direction_24h | 1 | 170906 | 48.774543 | 0 | 179494 | 1 | 170906 | 1.050250 |
| target_direction_72h | 0 | 182437 | 52.065354 | 0 | 182437 | 1 | 167963 | 1.086174 |
| target_direction_72h | 1 | 167963 | 47.934646 | 0 | 182437 | 1 | 167963 | 1.086174 |

### Target leakage validation

#### Data Leakage Validation Report

##### Dataset

* **Rows:** 350,400
* **Symbols:** 20
* **Time range:** 2024-08-26 09:00:00 → 2026-08-26 08:00:00
* **Target columns:** 18
* **Feature columns:** 81

##### Validation Results

| Check                           | Result | Details                                       |
| ------------------------------- | ------ | --------------------------------------------- |
| Target/feature overlap          | ✅ PASS | 0 overlapping columns                         |
| Duplicate symbol/timestamp rows | ✅ PASS | 0 duplicates                                  |
| Chronological ordering          | ✅ PASS | 0 non-increasing timestamp violations         |
| Target horizon validation       | ✅ PASS | All 18 targets match their declared horizons  |
| Return target reconstruction    | ✅ PASS | All 5 return targets reconstruct correctly    |
| Direction target reconstruction | ✅ PASS | All 5 direction targets reconstruct correctly |
| Suspicious feature names        | ✅ PASS | No obviously future-looking feature names     |

##### Target Horizon Validation

All target horizons were validated against the timestamp sequence within each symbol:

* 1h → 1 hour ahead
* 4h → 4 hours ahead
* 12h → 12 hours ahead
* 24h → 24 hours ahead
* 72h → 72 hours ahead

**Result: PASS**

##### Return Target Validation

The following targets were independently reconstructed from `close`:

* `target_return_1h`
* `target_return_4h`
* `target_return_12h`
* `target_return_24h`
* `target_return_72h`

Maximum reconstruction error:

```text
2.22e-16
```

This is floating-point precision error and is effectively zero.

**Result: PASS**

##### Direction Target Validation

Definition validated:

```text
1 = future close > current close
0 = future close <= current close
```

| Target                 | Mismatches |  Tested |
| ---------------------- | ---------: | ------: |
| `target_direction_1h`  |          0 | 350,380 |
| `target_direction_4h`  |          0 | 350,320 |
| `target_direction_12h` |          0 | 350,160 |
| `target_direction_24h` |          0 | 349,920 |
| `target_direction_72h` |          0 | 348,960 |

**Result: PASS**

##### End-of-Series Targets

Expected terminal missing values were confirmed for:

* Return targets
* Log-return targets
* Volatility targets

The binary direction targets contain `0/1` rather than terminal `NaN` values. This is a **label-construction behavior, not evidence of leakage**.

##### Conclusion

##### **Overall: ✅ PASS — No evidence of data leakage**

The validation found:

* No target columns inside the feature set.
* No duplicate `(symbol, timestamp)` observations.
* Correct chronological ordering.
* Correct target horizons.
* Correct return-target reconstruction.
* Correct direction-target reconstruction.
* No obviously future-looking feature names.

**Data leakage was not detected by the performed checks.**
