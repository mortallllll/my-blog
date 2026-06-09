'use client';

/**
 * 复古树叶边框装饰组件
 * 在页面四周绘制复古植物图谱风格的树叶藤蔓边框
 * 树叶带有轻微的上下浮动动画，模拟微风吹拂的效果
 */

interface LeafConfig {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  delay: number;
}

// 主叶片 SVG path（尖椭圆形，复古植物图谱风格）
const LEAF_PATH =
  'M0 6 C8 -8, 24 -8, 32 6 C24 20, 8 20, 0 6 Z';

// 小叶 path
const SMALL_LEAF_PATH =
  'M0 3 C3 -3, 10 -4, 14 3 C10 10, 3 10, 0 3 Z';

// 藤蔓卷须 path
const TENDRIL_PATH =
  'M0 0 Q 6 -6, 12 -2 Q 16 2, 20 -4';

/** 生成顶边/底边的藤蔓位置 */
function generateHorizontalLeaves(
  containerWidth: number,
  y: number,
  flipY: boolean
): { leaves: LeafConfig[]; vinePath: string } {
  const leaves: LeafConfig[] = [];
  const count = Math.floor(containerWidth / 80);
  const spacing = containerWidth / Math.max(count, 1);

  // 波浪形藤蔓路径
  const vinePoints: string[] = [];
  for (let i = 0; i <= count + 1; i++) {
    const vx = i * spacing;
    const vy = y + Math.sin(i * 0.8) * 8;
    vinePoints.push(`${i === 0 ? 'M' : 'L'} ${vx.toFixed(1)} ${vy.toFixed(1)}`);
  }
  const vinePath = vinePoints.join(' ');

  for (let i = 0; i < count; i++) {
    const x = (i + 0.5) * spacing + (Math.sin(i * 1.3) * 15);
    const rotation = flipY
      ? 160 + (i % 3) * 20 - 10 // 朝下的叶片
      : -20 + (i % 3) * 15 - 10; // 朝上的叶片
    const scale = 0.6 + (i % 3) * 0.2;
    const delay = (i * 0.37) % 5;

    leaves.push({ x, y, rotation, scale, delay });
  }

  return { leaves, vinePath };
}

/** 生成左侧边/右侧边的藤蔓位置 */
function generateVerticalLeaves(
  containerHeight: number,
  x: number,
  flipX: boolean
): { leaves: LeafConfig[]; vinePath: string } {
  const leaves: LeafConfig[] = [];
  const count = Math.floor(containerHeight / 70);
  const spacing = containerHeight / Math.max(count, 1);

  // 波浪形藤蔓
  const vinePoints: string[] = [];
  for (let i = 0; i <= count + 1; i++) {
    const vy = i * spacing;
    const vx = x + Math.sin(i * 0.9) * 8;
    vinePoints.push(`${i === 0 ? 'M' : 'L'} ${vx.toFixed(1)} ${vy.toFixed(1)}`);
  }
  const vinePath = vinePoints.join(' ');

  for (let i = 0; i < count; i++) {
    const y = (i + 0.5) * spacing + (Math.sin(i * 1.1) * 15);
    const rotation = flipX
      ? -110 + (i % 3) * 20 - 10 // 朝左
      : 70 + (i % 3) * 20 - 10; // 朝右
    const scale = 0.6 + (i % 3) * 0.2;
    const delay = (i * 0.43) % 5;

    leaves.push({ x, y, rotation, scale, delay });
  }

  return { leaves, vinePath };
}

function Leaf({ config, isSmall = false }: { config: LeafConfig; isSmall?: boolean }) {
  return (
    <g transform={`translate(${config.x}, ${config.y}) rotate(${config.rotation}) scale(${config.scale})`}>
      <path
        className="vintage-leaf"
        d={isSmall ? SMALL_LEAF_PATH : LEAF_PATH}
        style={{ animationDelay: `${config.delay}s` }}
      />
      {/* 叶脉 */}
      <line
        x1={0}
        y1={isSmall ? 3 : 6}
        x2={isSmall ? 14 : 32}
        y2={isSmall ? 3 : 6}
        className="vintage-vein"
        style={{ animationDelay: `${config.delay}s` }}
      />
    </g>
  );
}

export default function VintageLeafBorder() {
  // 默认尺寸 (用于 SSR)
  const w = 1440;
  const h = 900;

  const topData = generateHorizontalLeaves(w, 30, false);
  const bottomData = generateHorizontalLeaves(w, h - 30, true);
  const leftData = generateVerticalLeaves(h, 30, false);
  const rightData = generateVerticalLeaves(h, w - 30, true);

  // 四角装饰：每个角 3-4 片较大的叶片
  const corners: LeafConfig[][] = [
    // 左上角
    [
      { x: 20, y: 20, rotation: -30, scale: 1.0, delay: 0.2 },
      { x: 60, y: 15, rotation: 10, scale: 0.9, delay: 1.5 },
      { x: 15, y: 55, rotation: -60, scale: 0.85, delay: 3.1 },
      { x: 45, y: 50, rotation: -5, scale: 0.7, delay: 4.2 },
    ],
    // 右上角
    [
      { x: w - 20, y: 20, rotation: 150, scale: 1.0, delay: 0.8 },
      { x: w - 60, y: 15, rotation: 170, scale: 0.9, delay: 2.1 },
      { x: w - 15, y: 55, rotation: 120, scale: 0.85, delay: 3.7 },
      { x: w - 45, y: 50, rotation: 185, scale: 0.7, delay: 1.3 },
    ],
    // 左下角
    [
      { x: 20, y: h - 20, rotation: -150, scale: 1.0, delay: 1.1 },
      { x: 60, y: h - 15, rotation: -170, scale: 0.9, delay: 2.8 },
      { x: 15, y: h - 55, rotation: -120, scale: 0.85, delay: 4.5 },
      { x: 45, y: h - 50, rotation: -10, scale: 0.7, delay: 0.5 },
    ],
    // 右下角
    [
      { x: w - 20, y: h - 20, rotation: 120, scale: 1.0, delay: 1.9 },
      { x: w - 60, y: h - 15, rotation: 10, scale: 0.9, delay: 3.3 },
      { x: w - 15, y: h - 55, rotation: 60, scale: 0.85, delay: 0.1 },
      { x: w - 45, y: h - 50, rotation: 175, scale: 0.7, delay: 2.6 },
    ],
  ];

  // 装饰小圆点（模拟浆果/花苞）
  const berries = [
    { x: w * 0.15, y: 35, delay: 0.3 },
    { x: w * 0.35, y: 32, delay: 1.7 },
    { x: w * 0.55, y: 38, delay: 3.2 },
    { x: w * 0.75, y: 34, delay: 4.1 },
    { x: w * 0.9, y: 37, delay: 1.4 },
    { x: 32, y: h * 0.2, delay: 2.3 },
    { x: 28, y: h * 0.5, delay: 4.7 },
    { x: 35, y: h * 0.75, delay: 0.9 },
    { x: w - 32, y: h * 0.25, delay: 3.5 },
    { x: w - 28, y: h * 0.6, delay: 1.8 },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      <svg
        className="h-full w-full vintage-border-svg"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox={`0 0 ${w} ${h}`}
      >
        <defs>
          {/* 浆果渐变（使用 CSS class 适配 light-dark()） */}
          <radialGradient id="berry-grad" cx="30%" cy="30%">
            <stop offset="0%" className="vintage-berry-stop-1" />
            <stop offset="100%" className="vintage-berry-stop-2" />
          </radialGradient>
        </defs>

        {/* 顶边藤蔓 */}
        <g>
          <path
            d={topData.vinePath}
            fill="none"
            className="vintage-vine"
          />
          {topData.leaves.map((leaf, i) => (
            <Leaf key={`top-${i}`} config={leaf} isSmall={i % 4 === 0} />
          ))}
        </g>

        {/* 底边藤蔓 */}
        <g>
          <path
            d={bottomData.vinePath}
            fill="none"
            className="vintage-vine"
          />
          {bottomData.leaves.map((leaf, i) => (
            <Leaf key={`bottom-${i}`} config={leaf} isSmall={i % 4 === 0} />
          ))}
        </g>

        {/* 左边藤蔓 */}
        <g>
          <path
            d={leftData.vinePath}
            fill="none"
            className="vintage-vine"
          />
          {leftData.leaves.map((leaf, i) => (
            <Leaf key={`left-${i}`} config={leaf} isSmall={i % 4 === 0} />
          ))}
        </g>

        {/* 右边藤蔓 */}
        <g>
          <path
            d={rightData.vinePath}
            fill="none"
            className="vintage-vine"
          />
          {rightData.leaves.map((leaf, i) => (
            <Leaf key={`right-${i}`} config={leaf} isSmall={i % 4 === 0} />
          ))}
        </g>

        {/* 四角装饰 */}
        {corners.map((cornerLeaves, ci) => (
          <g key={`corner-${ci}`}>
            {cornerLeaves.map((leaf, li) => (
              <Leaf key={li} config={leaf} />
            ))}
          </g>
        ))}

        {/* 装饰浆果 */}
        {berries.map((berry, i) => (
          <circle
            key={`berry-${i}`}
            cx={berry.x}
            cy={berry.y}
            r="3"
            fill="url(#berry-grad)"
            className="vintage-berry"
            style={{ animationDelay: `${berry.delay}s` }}
          />
        ))}

        {/* 几处藤蔓卷须装饰（顶边、左边） */}
        <g
          transform="translate(180, 42) scale(0.6)"
          className="vintage-tendril"
          style={{ animationDelay: '0.6s' }}
        >
          <path d={TENDRIL_PATH} fill="none" className="vintage-vine" strokeWidth="1.5" />
        </g>
        <g
          transform="translate(520, 38) scale(0.5) rotate(20)"
          className="vintage-tendril"
          style={{ animationDelay: '2.4s' }}
        >
          <path d={TENDRIL_PATH} fill="none" className="vintage-vine" strokeWidth="1.5" />
        </g>
        <g
          transform="translate(42, 200) scale(0.6) rotate(70)"
          className="vintage-tendril"
          style={{ animationDelay: '3.8s' }}
        >
          <path d={TENDRIL_PATH} fill="none" className="vintage-vine" strokeWidth="1.5" />
        </g>
        <g
          transform="translate(38, 550) scale(0.5) rotate(55)"
          className="vintage-tendril"
          style={{ animationDelay: '1.2s' }}
        >
          <path d={TENDRIL_PATH} fill="none" className="vintage-vine" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}
