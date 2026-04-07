declare module 'asciichart' {
  export type PlotOptions = {
    height?: number
    colors?: string[]
    format?: (value: number, index: number) => string
  }

  export function plot(series: number[][], options?: PlotOptions): string
}
