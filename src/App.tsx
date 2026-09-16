import { useEffect, useState } from 'react'

type ModalKind = 'enter' | 'booking' | 'review' | 'contract' | 'records' | 'visitor' | null
type Appointment = {
  id: number; avatar: string; featured?: boolean; pending?: boolean; time?: string; title?: string;
  description: string; button: string; package: string; remaining?: number; total?: number; actions: ('contract'|'records'|'next')[]
}

const appointments: Appointment[] = [
  { id: 1, avatar: '/assets/doctor-wang.png', featured: true, time: '01-14 15:30–16:10（今天）', description: '王明哲｜视频', button: '进入咨询室', package: '深度咨询套餐（10次卡）', remaining: 2, total: 10, actions: ['contract', 'records', 'next'] },
  { id: 2, avatar: '/assets/doctor-li.png', title: '暂无预约', description: '李晓华｜提前预约以保咨询连贯', button: '立即预约', package: '深度咨询套餐（10次卡）', remaining: 8, total: 10, actions: ['contract', 'records'] },
  { id: 3, avatar: '/assets/doctor-zhang.png', pending: true, time: '01-30 15:30–16:10（审核中）', description: '张敏｜正在评估您的申请', button: '查看详情', package: '单次情绪疏导', actions: ['contract', 'records'] },
]

const Icon = ({name}:{name:string}) => {
  const common = { fill:'none', stroke:'currentColor', strokeWidth:1.8, strokeLinecap:'round' as const, strokeLinejoin:'round' as const }
  if(name==='contract') return <svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="3" {...common}/><path d="M8 8h8M8 12h8M8 16h5" {...common}/></svg>
  if(name==='records') return <svg viewBox="0 0 24 24"><path d="M6 7V5a2 2 0 0 1 2-2h7l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2" {...common}/><path d="M15 3v5h5M3 12h9M3 16h9" {...common}/></svg>
  if(name==='next') return <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3" {...common}/><path d="M7 3v4M17 3v4M3 10h18M8 14h2M14 14h2" {...common}/></svg>
  return null
}

function StatusBar(){return <div className="status"><b>9:41</b><div className="signals"><span className="bars"><i/><i/><i/><i/></span><svg className="wifi" viewBox="0 0 24 18"><path d="M2 5c5.7-4.7 14.3-4.7 20 0M5.5 9c3.7-3 9.3-3 13 0M9 13c1.7-1.3 4.3-1.3 6 0M12 16h.01"/></svg><span className="battery"><i/></span></div></div>}

function Header({onMenu}:{onMenu:()=>void}){return <header><button className="back" aria-label="返回" onClick={()=>history.length>1?history.back():alert('已经是当前页面')}><span/></button><h1>心理咨询</h1><button className="menu-pill" onClick={onMenu} aria-label="更多操作"><span className="dots">•••</span><i/><span className="target"><b/></span></button></header>}

function Tabs({active,setActive,onVisitor}:{active:number,setActive:(n:number)=>void,onVisitor:()=>void}){return <nav className="tabs"><div className="tab-group"><button className={active===0?'active':''} onClick={()=>setActive(0)}>全部咨询师</button><button className={active===1?'active':''} onClick={()=>setActive(1)}>我的咨询室</button></div><button className="visitor" onClick={onVisitor}><svg viewBox="0 0 24 24"><circle cx="10" cy="7" r="4"/><path d="M3 20c0-4 2.7-7 7-7 1.2 0 2.3.3 3.2.7M16 16h5M18 13l-3 3 3 3"/></svg>来访者</button></nav>}

const actionLabel = {contract:'合同签署', records:'预约记录', next:'预约下次'}
function PackagePanel({item,expanded,onToggle,onAction}:{item:Appointment,expanded:boolean,onToggle:()=>void,onAction:(a:string)=>void}){
  return <section className={'package '+(!expanded?'collapsed':'')}>
    <button className="package-title" onClick={onToggle}><strong>{item.package}</strong><span className="chevron">›</span>{item.remaining!=null&&<span className="remain">剩余 <b>{item.remaining}</b>/{item.total}</span>}</button>
    {expanded&&<>{item.remaining!=null&&<div className="progress"><i style={{width:`${item.remaining/item.total!*100}%`}}/></div>}
      <div className="actions">{item.actions.map(a=><button key={a} onClick={()=>onAction(a)}><Icon name={a}/><span>{item.pending&&a==='contract'?'查看合同':actionLabel[a]}</span></button>)}</div></>}
  </section>
}

function AppointmentCard({item,onOpen}:{item:Appointment,onOpen:(k:ModalKind)=>void}){
  const [expanded,setExpanded]=useState(true)
  const openMain=()=>onOpen(item.featured?'enter':item.pending?'review':'booking')
  return <article className={`appointment ${item.featured?'featured':''} ${item.pending?'pending':''}`}>
    {item.featured&&<div className="sofa-art"><span/><i/></div>}
    <div className="card-top"><img src={item.avatar} alt="咨询师头像"/><div className="info">{item.time&&<div className="time">{item.time}</div>}{item.title&&<div className="empty-title">{item.title}</div>}<div className="description">{item.description}</div></div><button className="main-action" onClick={openMain}>{item.button}</button></div>
    <PackagePanel item={item} expanded={expanded} onToggle={()=>setExpanded(v=>!v)} onAction={a=>onOpen(a==='contract'?'contract':a==='records'?'records':'booking')}/>
  </article>
}

function Modal({kind,onClose,onConfirm}:{kind:ModalKind,onClose:()=>void,onConfirm:()=>void}){
  useEffect(()=>{const h=(e:KeyboardEvent)=>e.key==='Escape'&&onClose();addEventListener('keydown',h);return()=>removeEventListener('keydown',h)},[onClose])
  if(!kind)return null
  const data={enter:['进入咨询室','确认现在进入王明哲咨询师的视频咨询室吗？'],booking:['预约咨询','选择方便的日期与时间，确认后即可提交预约。'],review:['申请审核详情','您的咨询申请正在由张敏老师评估，预计 24 小时内完成。'],contract:['咨询服务合同','合同已准备完成，签署前请仔细阅读服务范围与取消规则。'],records:['预约记录','近期预约：01-14 15:30，王明哲，视频咨询。'],visitor:['切换身份','当前身份为来访者，可查看和管理自己的咨询预约。']}[kind]
  return <div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={onClose}>×</button><h2>{data[0]}</h2><p>{data[1]}</p>{kind==='booking'&&<div className="picker"><label>日期<input type="date" defaultValue="2026-01-18"/></label><label>时间<select defaultValue="15:30"><option>10:00</option><option>14:00</option><option>15:30</option><option>19:00</option></select></label></div>}<button className="confirm" onClick={onConfirm}>{kind==='enter'?'确认进入':kind==='booking'?'确认预约':'我知道了'}</button></div></div>
}

function CustomerService(){const [open,setOpen]=useState(false);return <><button className="service" onClick={()=>setOpen(v=>!v)} aria-label="联系客服"><svg viewBox="0 0 32 32"><path d="M6 18v-3a10 10 0 0 1 20 0v3M8 17H6a3 3 0 0 0-3 3v3a3 3 0 0 0 3 3h2V17Zm16 0h2a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3h-2V17Zm0 9c-1 3-3 3-6 3"/></svg></button>{open&&<div className="service-panel"><b>在线客服</b><p>您好，请问有什么可以帮您？</p><button onClick={()=>setOpen(false)}>开始咨询</button></div>}</>}

export default function App(){
  const [tab,setTab]=useState(0),[modal,setModal]=useState<ModalKind>(null),[menu,setMenu]=useState(false),[toast,setToast]=useState('')
  const list=tab===0?appointments:appointments.slice(0,2)
  const confirm=()=>{setModal(null);setToast('操作已完成');setTimeout(()=>setToast(''),1800)}
  return <main className="phone"><StatusBar/><Header onMenu={()=>setMenu(v=>!v)}/>{menu&&<div className="top-menu"><button onClick={()=>{setMenu(false);setToast('页面已刷新')}}>刷新列表</button><button onClick={()=>{setMenu(false);setModal('records')}}>预约记录</button></div>}<Tabs active={tab} setActive={setTab} onVisitor={()=>setModal('visitor')}/><div className="cards">{list.map(a=><AppointmentCard key={a.id} item={a} onOpen={setModal}/>)}</div><CustomerService/><footer>已完成/已取消的咨询请前往 <button onClick={()=>setModal('records')}>预约记录</button> 中查看</footer><div className="home-indicator"/><Modal kind={modal} onClose={()=>setModal(null)} onConfirm={confirm}/>{toast&&<div className="toast">{toast}</div>}</main>
}
