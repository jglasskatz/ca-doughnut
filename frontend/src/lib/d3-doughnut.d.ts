interface DoughnutDimension {
  name: string
  level: number | null
  indicator: string
  value: string
  year?: number | null
  target?: string | null
  context?: string | null
  source?: string | null
  sourceUrl?: string | null
  screenshot?: string | null
  actions?: string[]
  ring?: string
}

interface DoughnutData {
  ecological: DoughnutDimension[]
  social: DoughnutDimension[]
}

interface D3DoughnutOptions {
  size?: number
  margin?: number
  onSelect?: (dim: DoughnutDimension | null) => void
  onHover?: (dim: DoughnutDimension | null, ring: string | null) => void
}

export class D3Doughnut {
  constructor(containerId: string, options?: D3DoughnutOptions)
  setData(data: DoughnutData): void
  render(): void
  selectedDim: DoughnutDimension | null
}
