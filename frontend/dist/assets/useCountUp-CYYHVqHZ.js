import{c as p}from"./index-DCYJqjYw.js";import{a as t}from"./vendor-BfGQTJdd.js";/**
 * @license lucide-react v0.454.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=p("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]]);function l(e,n=900){const[i,c]=t.useState(0),r=t.useRef(),s=t.useRef(null);return t.useEffect(()=>{if(!Number.isFinite(e))return;if(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches){c(e);return}if(s.current===e)return;s.current=e;const a=0,f=performance.now(),o=m=>{const u=Math.min(1,(m-f)/n),d=1-Math.pow(1-u,3);c(a+(e-a)*d),u<1&&(r.current=requestAnimationFrame(o))};return r.current=requestAnimationFrame(o),()=>{r.current&&cancelAnimationFrame(r.current)}},[e,n]),i}export{y as U,l as u};
