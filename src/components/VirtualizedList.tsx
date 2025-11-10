import React, { CSSProperties } from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  width?: string | number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  style?: CSSProperties;
  overscanCount?: number;
}

function VirtualizedList<T>({
  items,
  itemHeight,
  height,
  width = '100%',
  renderItem,
  className = '',
  style = {},
  overscanCount = 5,
}: VirtualizedListProps<T>) {
  const Row = ({ index, style: rowStyle }: { index: number; style: CSSProperties }) => (
    <div style={rowStyle} className="virtualized-list-item">
      {renderItem(items[index], index)}
    </div>
  );

  return (
    <div className={`virtualized-list ${className}`} style={style}>
      <List
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        width={width}
        overscanCount={overscanCount}
        className="virtualized-list-inner"
      >
        {Row}
      </List>
    </div>
  );
}

export default VirtualizedList;
