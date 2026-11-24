import React from 'react';

export function Table({ className = '', children, ...rest }) {
  return (
    <div className="table-container">
      <table className={`table ${className}`} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className = '', children, ...rest }) {
  return (
    <thead className={className} {...rest}>
      {children}
    </thead>
  );
}

export function TableBody({ className = '', children, ...rest }) {
  return (
    <tbody className={className} {...rest}>
      {children}
    </tbody>
  );
}

export function TableRow({ className = '', children, ...rest }) {
  return (
    <tr className={className} {...rest}>
      {children}
    </tr>
  );
}

export function TableHead({ className = '', children, ...rest }) {
  return (
    <th className={className} {...rest}>
      {children}
    </th>
  );
}

export function TableCell({ className = '', children, ...rest }) {
  return (
    <td className={className} {...rest}>
      {children}
    </td>
  );
}

export function TableEmpty({ colSpan = 1, message = 'No records found' }) {
  return (
    <TableRow>
      <TableCell className="text-center py-8" style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-secondary)' }}>
        {message}
      </TableCell>
    </TableRow>
  );
}

export default Table;

