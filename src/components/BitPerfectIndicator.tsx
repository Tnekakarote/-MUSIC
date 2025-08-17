import React from 'react';

const BitPerfectIndicator = ({ active }: { active: boolean }) => (
  <div style={{ color: active ? '#00FF84' : '#FF0000' }}>
    BIT-PERFECT: {active ? '✓' : '✗'}
  </div>
);

export default BitPerfectIndicator;
