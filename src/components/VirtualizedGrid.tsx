import React, { CSSProperties } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';

interface VirtualizedGridProps<T> {
  items: T[];
  columnCount: number;
  rowHeight: number;
  columnWidth: number;
  height: number;
  width: number;
  renderItem: (item: T, rowIndex: number, columnIndex: number) => React.ReactNode;
  className?: string;
  style?: CSSProperties;
  overscanRowCount?: number;
  overscanColumnCount?: number;
}

function VirtualizedGrid<T>({
  items,
  columnCount,
  rowHeight,
  columnWidth,
  height,
  width,
  renderItem,
  className = '',
  style = {},
  overscanRowCount = 2,
  overscanColumnCount = 2,
}: VirtualizedGridProps<T>) {
  const rowCount = Math.ceil(items.length / columnCount);

  const Cell = ({
    rowIndex,
    columnIndex,
    style: cellStyle,
  }: {
    rowIndex: number;
    columnIndex: number;
    style: CSSProperties;
  }) => {
    const itemIndex = rowIndex * columnCount + columnIndex;
    if (itemIndex >= items.length) {
      return <div style={cellStyle} />;
    }

    return (
      <div style={cellStyle} className="virtualized-grid-cell">
        {renderItem(items[itemIndex], rowIndex, columnIndex)}
      </div>
    );
  };

  return (
    <div className={`virtualized-grid ${className}`} style={style}>
      <Grid
        columnCount={columnCount}
        columnWidth={columnWidth}
        height={height}
        rowCount={rowCount}
        rowHeight={rowHeight}
        width={width}
        overscanRowCount={overscanRowCount}
        overscanColumnCount={overscanColumnCount}
        className="virtualized-grid-inner"
      >
        {Cell}
      </Grid>
    </div>
  );
}

export default VirtualizedGrid;
