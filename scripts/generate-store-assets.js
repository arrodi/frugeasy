const fs = require('fs');
const path = require('path');
const PImage = require('pureimage');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'store-assets');

function ensure(p) { fs.mkdirSync(p, { recursive: true }); }
ensure(OUT);
ensure(path.join(OUT, 'screenshots/phone'));
ensure(path.join(OUT, 'screenshots/tablet-7in'));
ensure(path.join(OUT, 'screenshots/tablet-10in'));

const regularFont = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const boldFont = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
PImage.registerFont(regularFont, 'Sans').loadSync();
PImage.registerFont(boldFont, 'SansBold').loadSync();

function rr(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

async function save(img, outPath) {
  await PImage.encodePNGToStream(img, fs.createWriteStream(outPath));
}

async function makeIcon() {
  const img = PImage.make(512, 512);
  const c = img.getContext('2d');
  c.fillStyle = '#0f172a'; c.fillRect(0, 0, 512, 512);
  rr(c, 86, 86, 340, 340, 56, '#f8fafc');
  rr(c, 150, 305, 40, 70, 8, '#16a34a');
  rr(c, 214, 250, 40, 125, 8, '#3b82f6');
  rr(c, 278, 210, 40, 165, 8, '#ef4444');
  c.fillStyle = '#facc15'; c.beginPath(); c.arc(356, 165, 36, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#0f172a'; c.font = 'bold 132px SansBold'; c.fillText('F', 126, 214);
  await save(img, path.join(OUT, 'app-icon-512.png'));
}

async function makeFeature() {
  const img = PImage.make(1024, 500);
  const c = img.getContext('2d');
  c.fillStyle = '#0f172a'; c.fillRect(0, 0, 1024, 500);
  c.fillStyle = 'white'; c.font = 'bold 64px SansBold'; c.fillText('Frugeasy', 42, 78);
  c.fillStyle = '#cbd5e1'; c.font = '32px Sans'; c.fillText('Track income and expenses in seconds', 44, 126);
  [120,360,600].forEach((x) => {
    rr(c, x, 70, 220, 360, 30, '#f8fafc', '#cbd5e1');
    c.fillStyle = '#334155'; c.font = '24px Sans'; c.fillText('Monthly', x+26, 114);
    rr(c, x+20, 146, 180, 58, 12, '#f0fdf4'); c.fillStyle = '#16a34a'; c.font = '22px Sans'; c.fillText('Income   $2,430', x+30, 182);
    rr(c, x+20, 218, 180, 58, 12, '#fef2f2'); c.fillStyle = '#dc2626'; c.fillText('Expense  $1,120', x+30, 254);
    rr(c, x+20, 290, 180, 58, 12, '#eff6ff'); c.fillStyle = '#2563eb'; c.fillText('Net      $1,310', x+30, 326);
  });
  c.fillStyle = '#94a3b8'; c.font = '30px Sans'; c.fillText('iOS + Android', 786, 460);
  await save(img, path.join(OUT, 'feature-graphic-1024x500.png'));
}

async function makeShot(w,h,mode,outPath) {
  const img = PImage.make(w,h); const c = img.getContext('2d');
  c.fillStyle = '#f8fafc'; c.fillRect(0,0,w,h);
  const m = Math.floor(w*0.06); let y = Math.floor(h*0.05);
  c.fillStyle = '#0f172a'; c.font = `bold ${Math.floor(h*0.036)}px SansBold`; c.fillText('Frugeasy', m, y+20); y += Math.floor(h*0.06);
  const th=Math.floor(h*0.055), tw=Math.floor((w-2*m-10)/2);
  rr(c,m,y,tw,th,14,mode==='add'?'#0f172a':'#fff','#cbd5e1'); rr(c,m+tw+10,y,tw,th,14,mode==='monthly'?'#0f172a':'#fff','#cbd5e1');
  c.font = `${Math.floor(h*0.023)}px Sans`;
  c.fillStyle=mode==='add'?'#fff':'#334155'; c.fillText('Add', m+Math.floor(tw/2)-20, y+Math.floor(th/2)+8);
  c.fillStyle=mode==='monthly'?'#fff':'#334155'; c.fillText('Monthly', m+tw+10+Math.floor(tw/2)-42, y+Math.floor(th/2)+8); y += th + Math.floor(h*0.03);

  c.fillStyle = '#0f172a'; c.fillText(mode==='add'?'Add income / expense':'Current month summary', m, y+20); y += Math.floor(h*0.05);

  if(mode==='add'){
    rr(c,m,y,w-m*2,Math.floor(h*0.07),14,'#fff','#cbd5e1'); c.fillStyle='#64748b'; c.fillText('Amount: 250.00', m+20, y+Math.floor(h*0.045)); y += Math.floor(h*0.09);
    const bw=Math.floor((w-2*m-10)/2); rr(c,m,y,bw,Math.floor(h*0.065),14,'#22c55e'); rr(c,m+bw+10,y,bw,Math.floor(h*0.065),14,'#e2e8f0');
    c.fillStyle='white'; c.fillText('Income', m+Math.floor(bw/2)-36, y+Math.floor(h*0.042)); c.fillStyle='#334155'; c.fillText('Expense', m+bw+10+Math.floor(bw/2)-40, y+Math.floor(h*0.042)); y += Math.floor(h*0.09);
    rr(c,m,y,w-m*2,Math.floor(h*0.065),14,'#2563eb'); c.fillStyle='white'; c.fillText('Save transaction', Math.floor(w/2)-82, y+Math.floor(h*0.042));
  } else {
    const cards=[['Income','$2,430','#16a34a'],['Expenditure','$1,120','#dc2626'],['Net','$1,310','#2563eb']];
    cards.forEach(([label,val,color])=>{rr(c,m,y,w-m*2,Math.floor(h*0.08),14,'#fff','#e2e8f0'); c.fillStyle='#475569'; c.font=`${Math.floor(h*0.02)}px Sans`; c.fillText(label,m+16,y+Math.floor(h*0.034)); c.fillStyle=color; c.font=`${Math.floor(h*0.024)}px Sans`; c.fillText(val,w-m-160,y+Math.floor(h*0.048)); y += Math.floor(h*0.095);});
    c.fillStyle='#0f172a'; c.font=`${Math.floor(h*0.023)}px Sans`; c.fillText('Transactions',m,y+20); y += Math.floor(h*0.045);
    [['INCOME','$900'],['EXPENSE','$120'],['INCOME','$530']].forEach(([t,a])=>{rr(c,m,y,w-m*2,Math.floor(h*0.06),12,'#fff','#e2e8f0'); c.fillStyle='#334155'; c.font=`${Math.floor(h*0.018)}px Sans`; c.fillText(t,m+16,y+Math.floor(h*0.038)); c.fillStyle='#0f172a'; c.fillText(a,w-m-100,y+Math.floor(h*0.038)); y += Math.floor(h*0.072);});
  }

  await save(img,outPath);
}

(async () => {
  await makeIcon();
  await makeFeature();
  await makeShot(1080,1920,'add',path.join(OUT,'screenshots/phone/phone-add-1080x1920.png'));
  await makeShot(1080,1920,'monthly',path.join(OUT,'screenshots/phone/phone-monthly-1080x1920.png'));
  await makeShot(1200,1920,'add',path.join(OUT,'screenshots/tablet-7in/tablet7-add-1200x1920.png'));
  await makeShot(1200,1920,'monthly',path.join(OUT,'screenshots/tablet-7in/tablet7-monthly-1200x1920.png'));
  await makeShot(1600,2560,'add',path.join(OUT,'screenshots/tablet-10in/tablet10-add-1600x2560.png'));
  await makeShot(1600,2560,'monthly',path.join(OUT,'screenshots/tablet-10in/tablet10-monthly-1600x2560.png'));
  console.log('Generated all store assets in', OUT);
})();
