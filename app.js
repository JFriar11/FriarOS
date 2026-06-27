const plan = {
  1: { title: 'Mon — Sprint Day 1', target: 'Training day: 180-200P / 300-350C / 60-80F', items: ['Lunge & Reach', 'Microskips', 'Ladder Landings', 'Icky Bounds', 'Fly Ins', 'Cool-down walk + stretch', 'Light catch 60-90 ft'] },
  2: { title: 'Tue — Recovery', target: 'Light day: 180-200P / 220-260C / 60-80F', items: ['20-30 min easy walk', '10-15 min mobility', 'Light catch only if needed'] },
  3: { title: 'Wed — Sprint Day 2', target: 'Training day: 180-200P / 300-350C / 60-80F', items: ['Blue sprint warm-up', 'Pacers or intervals', 'Leg circuit', 'Spiderman flow', 'Cool-down walk + stretch'] },
  4: { title: 'Thu — Recovery / Throwing', target: 'Light day: 180-200P / 220-260C / 60-80F', items: ['Mobility', 'Long toss progression', 'Arm care', 'Easy walk'] },
  5: { title: 'Fri — Upper Gym', target: 'Training day: 180-200P / 300-350C / 60-80F', items: ['Fober shoulder prep', 'DB Complex 1', 'Bench press 3x10', 'Incline press 3x10', 'Overhead press 3x10', 'Horizontal row 3x10', 'Pull-up/pulldown 3x10', 'Around-the-world pushups'] },
  6: { title: 'Sat — Lower Gym', target: 'Training day: 180-200P / 300-350C / 60-80F', items: ['Lunge & Reach', 'DB Complex 2', 'Squat variation 3x10', 'SL RDL / Good morning 3x10', 'Reverse lunge 3x10/leg', 'SL squat to box 3x15/leg', 'Short catch'] },
  0: { title: 'Sun — Sprint Day 3 + Mixed Gym', target: 'Training day: 180-200P / 300-350C / 60-80F', items: ['Lunge & Reach', 'Garcia Plyos', 'Baseball sprint accelerations', 'Squatgatta circuit', 'Descending pull-up/push-up supersets', 'Infield work / ground balls'] }
};

const today = new Date();
const dateKey = today.toISOString().slice(0,10);
let selectedDay = today.getDay();
const storeKey = () => `athleteOS:${dateKey}:${selectedDay}`;
const $ = id => document.getElementById(id);

function load(){ return JSON.parse(localStorage.getItem(storeKey()) || '{}'); }
function save(data){ localStorage.setItem(storeKey(), JSON.stringify(data)); }
function render(){
  const data = load();
  const p = plan[selectedDay];
  $('todayTitle').textContent = p.title;
  $('trainingDayTitle').textContent = p.title;
  $('macroTarget').textContent = p.target;
  $('checklist').innerHTML = '';
  p.items.forEach((txt, i)=>{
    const row = document.createElement('label'); row.className='item';
    const cb = document.createElement('input'); cb.type='checkbox'; cb.checked = !!data[`c${i}`];
    cb.onchange = ()=>{ const d=load(); d[`c${i}`]=cb.checked; save(d); updateProgress(); };
    const sp = document.createElement('span'); sp.textContent = txt;
    row.append(cb,sp); $('checklist').appendChild(row);
  });
  ['protein','carbs','fat','calories','sleep','whoop','weight','soreness','notesBox'].forEach(id=>{
    $(id).value = data[id] || '';
    $(id).oninput = ()=>{ const d=load(); d[id]=$(id).value; save(d); advice(); };
  });
  updateProgress(); advice();
}
function updateProgress(){
  const data=load(), total=plan[selectedDay].items.length;
  const done=plan[selectedDay].items.filter((_,i)=>data[`c${i}`]).length;
  $('doneCount').textContent=done; $('totalCount').textContent=total;
  $('progressBar').style.width = `${total ? done/total*100 : 0}%`;
}
function advice(){
  const d=load(); const whoop=Number(d.whoop||0), sore=Number(d.soreness||0);
  let msg='Log sleep, WHOOP, weight, and soreness to spot trends.';
  if(whoop && whoop < 40) msg='Red day: keep intensity sharp but cut total volume to about 50-60%.';
  else if(whoop && whoop < 67) msg='Yellow day: drop the last set or reduce accessories.';
  else if(whoop >= 67) msg='Green day: full volume if warm-up feels good.';
  if(sore >= 8) msg += ' High soreness: prioritize mobility and avoid extra reps.';
  $('recoveryAdvice').textContent = msg;
}
$('daySelect').innerHTML = Object.entries(plan).map(([k,v])=>`<option value="${k}">${v.title}</option>`).join('');
$('daySelect').value = selectedDay;
$('daySelect').onchange = e=>{ selectedDay = Number(e.target.value); render(); };
document.querySelectorAll('.tab').forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll('.tab,.panel').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active'); $(btn.dataset.tab).classList.add('active');
});
$('resetDayBtn').onclick=()=>{ localStorage.removeItem(storeKey()); render(); };
render();
