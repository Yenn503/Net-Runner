export type NotebookCellType = 'code' | 'markdown' | 'raw'

export type NotebookOutputImage = {
  image_data: string
  media_type: 'image/png' | 'image/jpeg'
}

export type NotebookCellStreamOutput = {
  output_type: 'stream'
  text: string | string[]
  name?: string
}

export type NotebookCellDisplayOutput = {
  output_type: 'display_data' | 'execute_result'
  data?: Record<string, unknown>
  metadata?: Record<string, unknown>
  execution_count?: number | null
}

export type NotebookCellErrorOutput = {
  output_type: 'error'
  ename: string
  evalue: string
  traceback: string[]
}

export type NotebookCellOutput =
  | NotebookCellStreamOutput
  | NotebookCellDisplayOutput
  | NotebookCellErrorOutput

export type NotebookCell = {
  cell_type: NotebookCellType
  id?: string
  source: string | string[]
  metadata?: Record<string, unknown>
  execution_count?: number | null
  outputs?: NotebookCellOutput[]
}

export type NotebookCellSourceOutput = {
  output_type: NotebookCellOutput['output_type']
  text?: string
  image?: NotebookOutputImage
}

export type NotebookCellSource = {
  cellType: NotebookCellType
  source: string
  execution_count?: number
  cell_id: string
  language?: string
  outputs?: NotebookCellSourceOutput[]
}

export type NotebookContent = {
  cells: NotebookCell[]
  metadata: {
    language_info?: {
      name?: string
      [key: string]: unknown
    }
    [key: string]: unknown
  }
  nbformat?: number
  nbformat_minor?: number
}
