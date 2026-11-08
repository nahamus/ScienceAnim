import{f as g}from"./gl-WgDOv5fb.js";const w=`
uniform vec2 uRes, uCenter, uC;
uniform float uScale, uIter, uJulia, uPal, uTime;
varying vec2 vUv;
vec3 pal(float t) {
  if (uPal < 0.5) return 0.5 + 0.5 * cos(6.28318 * (t * vec3(1.0, 1.0, 1.0) + vec3(0.0, 0.1, 0.2)));
  if (uPal < 1.5) return 0.5 + 0.5 * cos(6.28318 * (t * vec3(1.0, 0.7, 0.4) + vec3(0.0, 0.15, 0.20)));
  return 0.5 + 0.5 * cos(6.28318 * (t * vec3(0.8, 0.8, 0.5) + vec3(0.6, 0.45, 0.25)));
}
void main() {
  vec2 p = (vUv * uRes - 0.5 * uRes) / min(uRes.x, uRes.y);
  vec2 pos = uCenter + p * uScale;
  vec2 z = uJulia > 0.5 ? pos : vec2(0.0);
  vec2 c = uJulia > 0.5 ? uC : pos;
  float n = 0.0;
  float trap = 1e9;
  for (int i = 0; i < 1500; i++) {
    if (float(i) >= uIter) break;
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    trap = min(trap, abs(length(z) - 0.5));
    if (dot(z, z) > 256.0) break;
    n += 1.0;
  }
  vec3 col;
  if (n >= uIter) {
    col = vec3(0.01, 0.01, 0.025) + 0.08 * vec3(0.3, 0.4, 1.0) * exp(-trap * 12.0);
  } else {
    float sn = n - log2(log2(dot(z, z))) + 4.0;
    float t = sn * 0.025 + uTime * 0.02;
    col = pal(t);
    col *= 0.35 + 0.65 * smoothstep(0.0, 1.0, sn / 18.0);
  }
  gl_FragColor = vec4(pow(col, vec3(0.9)), 1.0);
}`,M={home:{x:-.6,y:0,s:2.6},seahorse:{x:-.743643887,y:.131825904,s:2e-5},mini:{x:-1.7548776662,y:0,s:25e-5},spiral:{x:-.761574,y:-.0847596,s:1e-4}},k={id:"mandelbrot",title:"The Mandelbrot Set",category:"math",tagline:"Infinite complexity from z → z² + c. Dive into the most famous shape in mathematics.",blurb:"Take a number, square it and add a constant. Repeat. For some constants the numbers stay small forever; for others they explode. Colour the plane by which is which, and the Mandelbrot set appears — a boundary of infinite intricacy, endlessly self-similar, from a rule a child could follow.",ideas:["The black region is every c for which repeating z → z² + c never escapes to infinity.","Colours show <b>how quickly</b> points escape.","The boundary is a <b>fractal</b>: zoom forever and new detail keeps appearing.","Tiny copies of the whole set appear all along its edge — <b>self-similarity</b>.","Every point c also has its own <b>Julia set</b>; the Mandelbrot set is a map of all of them."],hint:"Drag to pan · scroll to zoom · in Julia mode, move the cursor to change c",renderer:"webgl",renderScale:.8,thumbChapter:1,thumbFrames:300,params:[{key:"mode",label:"Fractal",type:"select",value:"mandel",options:[{value:"mandel",label:"Mandelbrot"},{value:"julia",label:"Julia"}]},{key:"iter",label:"Max iterations",type:"range",min:50,max:1500,step:10,value:300},{key:"pal",label:"Palette",type:"select",value:1,options:[{value:0,label:"Rainbow"},{value:1,label:"Ember"},{value:2,label:"Ocean"}]},{key:"cycle",label:"Cycle colours",type:"toggle",value:!0},{key:"home",label:"Reset view",type:"button",action:e=>e.fly("home")}],story:[{title:"One simple rule",text:"For each point c, start at zero and repeat <b>z → z² + c</b>. If z stays small forever, colour the point black — it’s in the set. Otherwise colour it by how fast it escapes.",formula:"z<sub>n+1</sub> = z<sub>n</sub><sup>2</sup> + c",params:{mode:"mandel",iter:300},enter:e=>e.fly("home",.1),duration:11},{title:"Dive into the edge",text:"We’re zooming into “Seahorse Valley”. However far we go, the boundary never smooths out. By the end of this dive we’re magnified over <b>100,000 times</b>.",params:{iter:600},enter:e=>e.fly("seahorse",13),duration:15},{title:"Copies of itself",text:"Out along the set’s spiky antenna sits a perfect miniature of the whole Mandelbrot set. There are infinitely many of these — the set contains endless copies of itself.",params:{iter:500},enter:e=>e.fly("mini",10),duration:14},{title:"Julia sets",text:"Fix c and colour by the starting z instead, and you get a <b>Julia set</b>. As c wanders around the edge of the Mandelbrot set, its Julia set morphs between dust, dragons and lightning.",params:{mode:"julia",iter:300},enter:e=>e.fly("home",.1,!0),duration:16},{title:"Explore",text:"Drag to pan and scroll to zoom. Switch to Julia mode and move your cursor to pick c. Increase iterations when you zoom deep.",params:{mode:"mandel",iter:400},enter:e=>e.fly("spiral",12),duration:20}],create(e){const{gl:f,params:u}=e,v=g(f,w);let r=-.6,i=0,n=Math.log(2.6),a=null,c=null,d=0,h=[-.8,.156],y=!0;function p(t,o=8,s=!1){const l=M[t];if(s){r=0,i=0,n=Math.log(3.2),a=null,y=!0;return}a={x0:r,y0:i,l0:n,x1:l.x,y1:l.y,l1:Math.log(l.s),t:0,dur:Math.max(.1,o)}}return{fly:p,onParam(t,o){t==="mode"&&(o==="julia"?p("home",.1,!0):p("home",.1))},pointerDown(t){c={x:t.x,y:t.y,cx:r,cy:i},a=null},pointerMove(t){if(u.mode==="julia"&&!c&&t.inside&&(y=!1,h=[-2+t.x/e.w*2.8,1.2-t.y/e.h*2.4]),!c)return;const o=Math.exp(n)/Math.min(e.w,e.h);r=c.cx-(t.x-c.x)*o,i=c.cy+(t.y-c.y)*o},pointerUp(){c=null},wheel(t,o){a=null;const s=Math.exp(n)/Math.min(e.w,e.h),l=r+(t.x-e.w/2)*s,m=i-(t.y-e.h/2)*s,x=Math.exp(o*.0015);n=Math.max(Math.log(1e-5),Math.min(Math.log(4),n+Math.log(x)));const b=Math.exp(n)/Math.min(e.w,e.h);r=l-(t.x-e.w/2)*b,i=m+(t.y-e.h/2)*b},update(t){if(d+=t,a){a.t+=t;const o=Math.min(1,a.t/a.dur),s=o<.5?2*o*o:1-Math.pow(-2*o+2,2)/2;n=a.l0+(a.l1-a.l0)*s;const l=1-Math.pow(1-Math.min(1,o*2.2),3);r=a.x0+(a.x1-a.x0)*l,i=a.y0+(a.y1-a.y0)*l,o>=1&&(a=null)}if(u.mode==="julia"&&y){const o=d*.18,s=.985+.03*Math.sin(d*.5),l=s*Math.cos(o),m=s*Math.sin(o);h=[l/2-(l*l-m*m)/4,m/2-2*l*m/4]}},draw(){v.draw({uRes:[f.drawingBufferWidth,f.drawingBufferHeight],uCenter:[r,i],uScale:Math.exp(n),uIter:u.iter,uJulia:u.mode==="julia"?1:0,uC:h,uPal:u.pal,uTime:u.cycle?d:0})},stats(){return[{label:"Magnification",value:`${(2.6/Math.exp(n)).toExponential(1).replace("e+","×10^")}`},{label:"Centre",value:`${r.toFixed(5)}, ${i.toFixed(5)}`},u.mode==="julia"?{label:"c",value:`${h[0].toFixed(3)} ${h[1]>=0?"+":"−"} ${Math.abs(h[1]).toFixed(3)}i`}:{label:"Iterations",value:String(u.iter)}]}}}};export{k as default};
//# sourceMappingURL=mandelbrot-C3g4NeMO.js.map
