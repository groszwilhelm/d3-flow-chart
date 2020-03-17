export interface ChartConfig {
    data: ChartData;
}

export interface ChartData {
    name: string;
    value: any;
    type?: string;
    level?: string;
    children?: Array<ChartData>;
}
