declare module 'plotly.js-dist-min' {
  import type { Data, Layout, Config } from 'plotly.js'
  const Plotly: {
    downloadImage(
      graph: string | HTMLElement,
      opts: {
        format: string
        width: number
        height: number
        filename: string
      },
    ): Promise<void>
  }
  export default Plotly
  export type { Data, Layout, Config }
}
