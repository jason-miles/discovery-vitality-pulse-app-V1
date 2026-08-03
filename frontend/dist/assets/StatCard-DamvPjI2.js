import{j as e}from"./vendor-D5NBR2CB.js";import{c as i,a as l}from"./index-CiIJJ5Y7.js";import{R as x,M as p,z as u}from"./tooltip-CD-aJ5ap.js";import{L as f}from"./BarChart-C06rVoF9.js";/**
 * @license lucide-react v0.454.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=i("ArrowDownRight",[["path",{d:"m7 7 10 10",key:"1fmybs"}],["path",{d:"M17 7v10H7",key:"6fjiku"}]]);/**
 * @license lucide-react v0.454.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=i("ArrowUpRight",[["path",{d:"M7 7h10v10",key:"1tivn9"}],["path",{d:"M7 17 17 7",key:"1vkiza"}]]);/**
 * @license lucide-react v0.454.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=i("Minus",[["path",{d:"M5 12h14",key:"1ays0h"}]]);function N({label:n,value:a,delta:t,higherIsBetter:o=!0,sparkline:s,index:r=0}){const d=t==null?null:o?t>=0:t<=0,m=t==null?y:t>=0?v:j;return e.jsxs("div",{className:"card-in rounded-xl border border-line bg-white p-5 shadow-card",style:{animationDelay:`${Math.min(r,6)*50}ms`},children:[e.jsx("div",{className:"text-xs font-medium text-ink/55",children:n}),e.jsxs("div",{className:"mt-1.5 flex items-end justify-between gap-2",children:[e.jsx("div",{className:"tnum font-display text-[32px] font-semibold leading-none text-ink",children:a}),s&&s.length>1&&e.jsx("div",{className:"h-8 w-20 opacity-80",children:e.jsx(x,{width:"100%",height:"100%",children:e.jsx(f,{data:s.map((c,h)=>({i:h,v:c})),children:e.jsx(p,{type:"monotone",dataKey:"v",stroke:u.deepTeal,strokeWidth:1.5,dot:!1,isAnimationActive:!1})})})})]}),t!=null&&e.jsxs("div",{className:l("mt-2 flex items-center gap-1 text-xs font-medium",d?"text-[#227C57]":"text-alert"),children:[e.jsx(m,{className:"h-3.5 w-3.5"}),e.jsxs("span",{className:"tnum",children:[Math.abs(t).toFixed(1),"%"]}),e.jsx("span",{className:"text-ink/40",children:"vs prior period"})]})]})}export{N as S};
