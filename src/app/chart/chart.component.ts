import { Component, Input, ElementRef, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import { ChartData } from '../flow-chart.model';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
  styles: [`
    :host {
      display: block;
      width: 1000px;
      height: 600px;
    }
  `],
})
export class ChartComponent {
  @Input() chartData: ChartData = treeData;

  constructor(private elementRef: ElementRef) { }

  ngAfterViewInit() {
    new Chart(this.elementRef, this.chartData);
  }
}

class Chart {
  private config: ChartConfig;
  private selectedNode;

  constructor(hostElement: ElementRef, private chartData: ChartData) {
    this.configureChart(hostElement);
    this.renderChart(this.chartData);
  }

  private configureChart({ nativeElement }: ElementRef<any>): void {
    this.config = new ChartConfig(nativeElement.clientWidth, nativeElement.clientHeight);
  }

  private renderChart(chartData: ChartData) {
    console.warn(chartData);
    const nodes = this.getTreeFromData(chartData);

    const { height, width, margin } = this.config;

    const group = this.setupChartContainer(width, margin, height);
    this.createLinksBetweenNodes(group, nodes);
    const node = this.groupNodes(group, nodes);
    this.drawNodeAs(node, 'circle');
    this.attachTextToNodes(node);
  }

  private setupChartContainer(width: number, margin: { top: number; left: number; right: number; bottom: number; }, height: number) {
    const svg = d3.select('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    this.attachAssetsToSvg(svg);

    return svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  }

  private attachTextToNodes(node: D3NodeSelection) {
    node.append('text')
      .attr('dy', '2.35em')
      .attr('dx', '1.20em')
      .text((d: any) => d.data.name);
  }

  private drawNodeAs(node: D3NodeSelection, as) {
    node.append('rect')
      .attr('width', 70)
      .attr('height', 70)
      .style('stroke', (d: any) => d.data.type)
      .style('fill', 'rgba(0, 0, 0, 0)');
  }

  private groupNodes(group: D3GroupSelection, nodes: d3.HierarchyPointNode<unknown>) {
    const self = this;

    return group.selectAll('.node')
      .data(nodes.descendants())
      .enter().append('g')
      .attr('class', d => 'node' + (d.children ? ' node--internal' : ' node--leaf'))
      .attr('transform', d => 'translate(' + d.y + ',' + (d.x - 35) + ')')
      .on('click', d => this.nodeClickHandler(d))
      .attr('pointer-events', 'mouseover')
      .attr('style', 'cursor:pointer')
      .on("mouseover", function (node) {
        self.selectedNode = node;
      })
      .on("mouseout", function (node) {
        self.selectedNode = null;
      });
  }

  private createLinksBetweenNodes(group: D3GroupSelection, nodes: d3.HierarchyPointNode<unknown>): void {
    group.selectAll('.link')
      .data(nodes.descendants().slice(1))
      .enter().append('path')
      .attr("marker-start", "url(#triangle)")
      .attr('class', 'link')
      .style('stroke', (d: any) => d.data.level)
      .attr('fill', 'none')
      .attr('d', d =>
        `M ${d.y},${d.x}C${(d.y + d.parent.y) / 2}, ${d.x} ${(d.y + d.parent.y) / 2},${d.parent.x} ${d.parent.y + 70}, ${d.parent.x}`
      );
  }

  private getTreeFromData(data: ChartData) {
    const treemap = d3.tree().size([this.config.height, this.config.width]);
    let nodes = d3.hierarchy(data, d => d.children);
    return treemap(nodes);
  }

  private attachAssetsToSvg(svg) {
    const self = this;

    svg.append("svg:defs").append("svg:marker")
      .attr("id", "triangle")
      .attr("refX", 6)
      .attr("refY", 6)
      .attr("markerWidth", 30)
      .attr("markerHeight", 30)
      .attr("markerUnits", "userSpaceOnUse")
      .append("path")
      .attr("d", "M 0 0 12 6 0 12 3 6")
      .style("fill", "black");

    const group = svg.selectAll("svg")
      .data([{ value: 'Hey', name: 'Oh', y: 10 }, { value: 'hey 2', name: 'Oh no', y: 80 }, { value: '1', name: 'Nope', y: 150 }])
      .enter().append('g')
      .attr('style', 'cursor:pointer');

    group
      .append('rect')
      .attr('x', 10)
      .attr('y', d => d.y)
      .attr('width', 50)
      .attr('height', 50)
      .attr("fill", 'white')
      .attr("stroke", "#039BE5")
      .attr("stroke-width", "1px")

    group.append('text')
      .attr('dy', '1.75em')
      .attr('dx', '1.25em')
      .attr('y', d => d.y)
      .text((d: any) => d.name);

    group.call(d3.drag()
      .on('start', function () {
        console.log('wtds');
      })
      .on('drag', function (d) {
        d3.select(this).select('text')
          .attr("x", d3.event.x)
          .attr("y", d3.event.y);

        d3.select(this).select('rect')
          .attr("x", d3.event.x)
          .attr("y", d3.event.y);
      })
      .on('end', function (d: any) {
        d3.select(this).select('text')
          .attr("x", 10)
          .attr("y", d.y);

        d3.select(this).select('rect')
          .attr("x", 10)
          .attr("y", d.y);

        self.selectedNode.data.name = d.name;
        self.selectedNode.data.value = d.value;

        d3.selectAll('svg > *').remove();
        self.renderChart(self.chartData)
      })
    )
  }

  private nodeClickHandler(d) {
    console.log(d);
    if (!d.data.children) { d.data.children = [] }
    d.data.children.push({ value: null, name: 'new', type: 'blue', level: 'blue' })
    d3.selectAll('svg > *').remove();
    this.renderChart(this.chartData);
  }
}

export type D3NodeSelection = d3.Selection<SVGGElement, d3.HierarchyPointNode<unknown>, SVGGElement, unknown>;
export type D3GroupSelection = d3.Selection<SVGGElement, unknown, HTMLElement, any>;

class ChartConfig {
  public margin = {
    top: 30,
    left: 90,
    right: 90,
    bottom: 30
  };

  constructor(public width: number, public height: number) { }
}

const treeData = {
  id: 1,
  'name': 'Eve',
  'value': 15,
  'type': 'red',
  'level': 'red',
  'padding': 50,
  'children': [
    {
      id: 2,
      'name': 'Cain',
      'value': 10,
      'type': 'red',
      'level': 'red',
      // 'padding': 20
    },
    {
      id: 3,
      'name': 'Seth',
      'value': 10,
      'type': 'red',
      'level': 'red',
      // 'padding': 20,
      'children': [
        {
          id: 4,
          'name': 'Enos',
          'value': 7.5,
          'type': 'red',
          'level': 'red',
          // 'padding': 20
        },
        {
          id: 5,
          'name': 'Noam',
          'value': 7.5,
          'type': 'red',
          'level': 'red',
          // 'padding': 20
        }
      ]
    },
    {
      id: 6,
      'name': 'Abel',
      'value': 10,
      'type': 'red',
      'level': 'red',
      // 'padding': 20
    },
    {
      id: 7,
      'name': 'Awan',
      'value': 10,
      'type': 'red',
      'level': 'red',
      // 'padding': 20,
      'children': [
        {
          id: 8,
          'name': 'Enoch',
          'value': 7.5,
          'type': 'red',
          'level': 'red',
          // 'padding': 20
        }
      ]
    },
    {
      id: 9,
      'name': 'Azura',
      'value': 10,
      'type': 'red',
      'level': 'red',
      // 'padding': 20
    }
  ]
};
