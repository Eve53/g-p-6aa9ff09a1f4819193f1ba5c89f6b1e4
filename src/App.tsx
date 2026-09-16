import { useEffect, useRef, useState } from 'react'
import { businessConfig } from './businessConfig'
import { consultationTimeLabel, contractActionLabel, signContractAndUpdate, type ContractStatus } from './appointmentLogic'

type ModalKind = 'enter' | 'appointment' | 'device' | 'booking' | 'review' | 'contract' | 'records' | 'visitor' | null
type ReviewState = 'pending' | 'supplement' | 'approved' | 'adjust' | 'overdue' | 'failed'
type Appointment = {
  id: number; avatar: string; featured?: boolean; pending?: boolean; time?: string; title?: string;
  description: string; button: string; package: string; remaining?: number; total?: number; actions: ('contract'|'records'|'next')[];
  requestedSlot?: string; contractStatus: ContractStatus
}

const appointments: Appointment[] = [
  { id: 1, avatar: '/assets/doctor-wang.png', featured: true, time: '01-14 15:30–16:10（今天）', description: '王明哲｜视频', button: '进入咨询室', package: '深度咨询套餐（10次卡）', remaining: 2, total: 10, actions: ['contract', 'records', 'next'], contractStatus: 'unsigned' },
  { id: 2, avatar: '/assets/doctor-li.png', title: '暂无预约', description: '李晓华', button: '立即预约', package: '深度咨询套餐（10次卡）', remaining: 8, total: 10, actions: ['contract', 'records'], contractStatus: 'unsigned' },
  { id: 3, avatar: '/assets/doctor-zhang.png', pending: true, requestedSlot: '01-30 15:30–16:10', description: '张敏｜视频', button: '查看进度', package: '单次情绪疏导', actions: ['contract', 'records'], contractStatus: 'signed' },
]

const pad = (value:number) => String(value).padStart(2,'0')
const hhmm = (date:Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`
const shortDate = (date:Date) => `${date.getMonth()+1}月${date.getDate()}日 ${hhmm(date)}`

function appointmentPhase(now:number, start:number){
  const remaining=Math.max(0,Math.ceil((start-now)/60000))
  if(now>=start+40*60000) return {button:'查看预约',relative:'本次已结束',modal:'appointment' as ModalKind}
  if(now>=start) return {button:'继续咨询',relative:`已开始${Math.floor((now-start)/60000)}分`,modal:'enter' as ModalKind}
  if(remaining<=businessConfig.roomOpenBeforeMinutes) return {button:'进入咨询室',relative:`距开始${remaining}分`,modal:'enter' as ModalKind}
  if(remaining<=businessConfig.deviceCheckBeforeMinutes) return {button:'检测设备',relative:`距开始${remaining}分`,modal:'device' as ModalKind}
  return {button:'查看预约',relative:remaining>=60?`约${Math.ceil(remaining/60)}小时后`:`距开始${remaining}分`,modal:'appointment' as ModalKind}
}

function reviewCopy(status:ReviewState, due:Date, requestedSlot?:string){
  const finish=`预计${shortDate(due)}前`
  const notify=businessConfig.notificationChannel?`通过${businessConfig.notificationChannel}通知`:'结果在本页查看（通知渠道待配置）'
  switch(status){
    case 'pending': return {time:consultationTimeLabel(requestedSlot),description:'审核中 · 张敏｜视频',eta:`${finish}完成审核`,details:`申请咨询：${consultationTimeLabel(requestedSlot)}。${finish}完成审核。${notify}。`,button:'查看进度'}
    case 'supplement': return {time:'需要补充资料',description:'张敏｜视频·需要您操作',eta:'',details:`审核已暂停，请补充资料后重试。${notify}。`,button:'补充资料'}
    case 'approved': return {time:'审核已通过',description:'张敏｜视频·请预约时间',eta:'',details:`申请已通过，请选择咨询时间。${notify}。`,button:'预约时间'}
    case 'adjust': return {time:'申请需调整',description:'张敏｜视频·需要您修改',eta:'',details:`申请时间需调整，请重新选择。${notify}。`,button:'查看进度'}
    case 'overdue': return {time:'审核延迟',description:'张敏｜视频·可联系咨询助理',eta:'',details:`已超过${shortDate(due)}，仍在确认进度。请刷新或联系客服。`,button:'查看进度'}
    case 'failed': return {time:'状态获取失败',description:'张敏｜视频·请重试获取',eta:'',details:'无法获取最新审核结果；保留上次已知状态。请检查网络后重试。',button:'查看进度'}
  }
}

const Icon = ({name}:{name:string}) => {
  const common = { fill:'none', stroke:'currentColor', strokeWidth:1.8, strokeLinecap:'round' as const, strokeLinejoin:'round' as const }
  if(name==='contract') return <svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="3" {...common}/><path d="M8 8h8M8 12h8M8 16h5" {...common}/></svg>
  if(name==='records') return <svg viewBox="0 0 24 24"><path d="M6 7V5a2 2 0 0 1 2-2h7l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2" {...common}/><path d="M15 3v5h5M3 12h9M3 16h9" {...common}/></svg>
  if(name==='next') return <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3" {...common}/><path d="M7 3v4M17 3v4M3 10h18M8 14h2M14 14h2" {...common}/></svg>
  return null
}

function StatusBar(){return <div className="status"><b>9:41</b><div className="signals"><span className="bars"><i/><i/><i/><i/></span><svg className="wifi" viewBox="0 0 24 18"><path d="M2 5c5.7-4.7 14.3-4.7 20 0M5.5 9c3.7-3 9.3-3 13 0M9 13c1.7-1.3 4.3-1.3 6 0M12 16h.01"/></svg><span className="battery"><i/></span></div></div>}

function Header({onMenu,onBack,title='心理咨询',showMenu=true}:{onMenu:()=>void,onBack:()=>void,title?:string,showMenu?:boolean}){return <header><button className="back" aria-label="返回" onClick={onBack}><span/></button><h1>{title}</h1>{showMenu&&<button className="menu-pill" onClick={onMenu} aria-label="更多操作"><span className="dots">•••</span><i/><span className="target"><b/></span></button>}</header>}

function Tabs({active,setActive,onVisitor}:{active:number,setActive:(n:number)=>void,onVisitor:()=>void}){return <nav className="tabs"><div className="tab-group"><button className={active===0?'active':''} onClick={()=>setActive(0)}>全部咨询师</button><button className={active===1?'active':''} onClick={()=>setActive(1)}>我的咨询室</button></div><button className="visitor" onClick={onVisitor}><svg viewBox="0 0 24 24"><circle cx="10" cy="7" r="4"/><path d="M3 20c0-4 2.7-7 7-7 1.2 0 2.3.3 3.2.7M16 16h5M18 13l-3 3 3 3"/></svg>来访者</button></nav>}

const actionLabel = {records:'预约记录', next:'预约下次'}
function PackagePanel({item,contractStatus,onDetails,onAction}:{item:Appointment,contractStatus:ContractStatus,onDetails:()=>void,onAction:(a:string)=>void}){
  return <section className="package">
    <button className="package-title" onClick={onDetails} aria-label={`查看${item.package}详情`}><strong>{item.package}</strong><span className="chevron">›</span>{item.remaining!=null&&<span className="remain">剩余 <b>{item.remaining}</b>/{item.total}</span>}</button>
    {item.remaining!=null&&<div className="progress"><i style={{width:`${item.remaining/item.total!*100}%`}}/></div>}
    <div className="actions">{item.actions.map(a=><button key={a} onClick={()=>onAction(a)}><Icon name={a}/><span>{a==='contract'?contractActionLabel(contractStatus):actionLabel[a]}</span></button>)}</div>
  </section>
}

function AppointmentCard({item,contractStatus,now,start,reviewState,reviewDue,busy,onOpen,onPackageDetails}:{item:Appointment,contractStatus:ContractStatus,now:number,start:number,reviewState:ReviewState,reviewDue:Date,busy:boolean,onOpen:(k:ModalKind,id?:number)=>void,onPackageDetails:(id:number)=>void}){
  const phase=appointmentPhase(now,start)
  const review=reviewCopy(reviewState,reviewDue,item.requestedSlot)
  const firstTime=`今天 ${hhmm(new Date(start))}–${hhmm(new Date(start+40*60000))}`
  const displayTime=item.featured?firstTime:item.pending?review.time:item.time
  const displayDescription=item.featured?`王明哲｜视频 · ${phase.relative}`:item.pending?review.description:item.description
  const button=item.featured?phase.button:item.pending?review.button:item.button
  const openMain=()=>onOpen(item.featured?phase.modal:item.pending?'review':'booking')
  return <article className={`appointment ${item.featured?'featured':''} ${item.pending?'pending':''}`}>
    {item.featured&&<div className="sofa-art"><span/><i/></div>}
    <div className="card-top"><img src={item.avatar} alt="咨询师头像"/><div className="info">{displayTime&&<div className="time">{displayTime}</div>}{item.title&&<div className="empty-title">{item.title}</div>}<div className="description">{displayDescription}</div>{item.pending&&review.eta&&<div className="review-eta">{review.eta}</div>}</div><button className="main-action" disabled={busy} onClick={openMain}>{busy?'处理中…':button}</button></div>
    <PackagePanel item={item} contractStatus={contractStatus} onDetails={()=>onPackageDetails(item.id)} onAction={a=>onOpen(a==='contract'?'contract':a==='records'?'records':'booking',item.id)}/>
  </article>
}

function Modal({kind,onClose,onConfirm,reviewState,reviewDue,requestedSlot,contractStatus,message,busy,draft,setDraft}:{kind:ModalKind,onClose:()=>void,onConfirm:()=>void,reviewState:ReviewState,reviewDue:Date,requestedSlot?:string,contractStatus:ContractStatus,message:string,busy:boolean,draft:string,setDraft:(value:string)=>void}){
  useEffect(()=>{const h=(e:KeyboardEvent)=>e.key==='Escape'&&onClose();addEventListener('keydown',h);return()=>removeEventListener('keydown',h)},[onClose])
  if(!kind)return null
  const review=reviewCopy(reviewState,reviewDue,requestedSlot)
  const data={enter:['进入咨询室','将检查网络及咨询室状态；本演示未接入真实咨询服务。'],appointment:['预约详情','预约信息为本地样例；进入开放时间以业务配置为准。'],device:['检测设备','点击后检查摄像头和麦克风，不保存音视频。'],booking:['预约咨询','演示页未接入真实排班，所选时间不会提交预约。'],review:['审核进度',review.details],contract:['咨询服务合同',contractStatus==='signed'?'该订单合同已签署。正式合同文件请在小程序查看。':'该订单合同未签署。签署状态仅在正式服务确认成功后更新。'],records:['预约记录','历史预约服务尚未接入，当前订单不会改变。'],visitor:['来访者','当前为来访者视角，真实身份切换尚未接入。']}[kind]
  const confirmLabel=kind==='enter'?'检查并进入':kind==='device'?'开始检测':kind==='review'?reviewState==='supplement'?'提交资料':reviewState==='approved'||reviewState==='adjust'?'选择时间':'刷新进度':kind==='booking'?'查看可预约状态':kind==='contract'&&contractStatus==='unsigned'?'签署合同':'我知道了'
  return <div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal" role="dialog" aria-modal="true"><button className="modal-close" aria-label="关闭" onClick={onClose}>×</button><h2>{data[0]}</h2><p>{data[1]}</p>{kind==='review'&&reviewState==='supplement'&&<label className="supplement-label">补充说明<textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder="请填写需要补充的情况"/></label>}{kind==='booking'&&<div className="picker"><label>日期<input type="date"/></label><label>时间<select defaultValue="15:30"><option>10:00</option><option>14:00</option><option>15:30</option><option>19:00</option></select></label></div>}{message&&<p className="modal-feedback" role="status">{message}</p>}<button className="confirm" disabled={busy} onClick={onConfirm}>{busy?'处理中…':confirmLabel}</button></div></div>
}

function CustomerService(){const [open,setOpen]=useState(false);return <><button className="service" onClick={()=>setOpen(v=>!v)} aria-label="联系客服"><svg viewBox="0 0 32 32"><path d="M6 18v-3a10 10 0 0 1 20 0v3M8 17H6a3 3 0 0 0-3 3v3a3 3 0 0 0 3 3h2V17Zm16 0h2a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3h-2V17Zm0 9c-1 3-3 3-6 3"/></svg></button>{open&&<div className="service-panel"><b>在线客服</b><p>您好，请问有什么可以帮您？</p><button onClick={()=>setOpen(false)}>开始咨询</button></div>}</>}

export default function App(){
  const [tab,setTab]=useState(1),[modal,setModal]=useState<ModalKind>(null),[menu,setMenu]=useState(false),[toast,setToast]=useState('')
  const [contractStatuses,setContractStatuses]=useState<Record<number,ContractStatus>>(()=>Object.fromEntries(appointments.map(item=>[item.id,item.contractStatus])))
  const [activeContractId,setActiveContractId]=useState<number|null>(null)
  const [packageId,setPackageId]=useState(()=>Number(new URLSearchParams(location.search).get('package'))||null)
  const [now,setNow]=useState(Date.now()),[start]=useState(()=>Date.now()+12*60000)
  const [reviewDue]=useState(()=>new Date(Date.now()+businessConfig.reviewSlaHours*3600000))
  const [reviewState]=useState<ReviewState>(()=>{const candidate=new URLSearchParams(location.search).get('review');return ['pending','supplement','approved','adjust','overdue','failed'].includes(candidate??'')?candidate as ReviewState:'pending'})
  const [message,setMessage]=useState(''),[draft,setDraft]=useState(''),[busy,setBusy]=useState(false)
  const busyRef=useRef(false)
  useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),15000);return()=>window.clearInterval(timer)},[])
  useEffect(()=>{const saved=sessionStorage.getItem('consultation-scroll');if(saved)requestAnimationFrame(()=>window.scrollTo(0,Number(saved)));const save=()=>sessionStorage.setItem('consultation-scroll',String(window.scrollY));addEventListener('scroll',save,{passive:true});return()=>removeEventListener('scroll',save)},[])
  useEffect(()=>{const syncPage=()=>{setPackageId(Number(new URLSearchParams(location.search).get('package'))||null);requestAnimationFrame(()=>window.scrollTo(0,Number(sessionStorage.getItem('consultation-scroll')||0)))};addEventListener('popstate',syncPage);return()=>removeEventListener('popstate',syncPage)},[])
  const currentReview=reviewState==='pending'&&now>reviewDue.getTime()?'overdue':reviewState
  const showToast=(value:string)=>{setToast(value);window.setTimeout(()=>setToast(''),1800)}
  const open=(kind:ModalKind,id?:number)=>{setMessage('');if(kind==='contract')setActiveContractId(id??null);setModal(kind)}
  const close=()=>{setMessage('');setModal(null)}
  const run=async(task:()=>Promise<void>,pendingMessage='正在检查，请稍候…')=>{if(busyRef.current)return;busyRef.current=true;setBusy(true);setMessage(pendingMessage);try{await task()}finally{busyRef.current=false;setBusy(false)}}
  const confirm=()=>{
    if(modal==='enter'){void run(async()=>{setMessage(!navigator.onLine?'网络未连接。请恢复网络后重试；预约信息已保留。':!businessConfig.roomEndpoint?'尚未配置咨询室服务。请在正式小程序进入，或稍后重试。':!businessConfig.roomReady?'咨询室尚未就绪。请稍后重试或联系客服；预约信息已保留。':'当前网页未接入小程序鉴权，无法实际进入咨询室。')});return}
    if(modal==='device'){void run(async()=>{if(!navigator.onLine){setMessage('网络未连接。请恢复网络后重试。');return}if(!navigator.mediaDevices?.getUserMedia){setMessage('当前环境不支持设备检测，请在正式小程序中重试。');return}try{const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:true});stream.getTracks().forEach(track=>track.stop());setMessage('摄像头和麦克风可用；真实咨询室尚未接入。')}catch(error){const name=error instanceof DOMException?error.name:'';setMessage(name==='NotAllowedError'?'摄像头或麦克风权限被拒绝。请在系统设置中允许后重试。':name==='NotFoundError'?'未找到摄像头或麦克风。请连接设备后重试。':'检测失败。请检查设备占用与系统设置后重试。')}});return}
    if(modal==='review'){
      if(currentReview==='approved'||currentReview==='adjust'){open('booking');return}
      if(currentReview==='supplement'&&!draft.trim()){setMessage('请先填写补充说明，草稿会保留。');return}
      void run(async()=>setMessage(!navigator.onLine?'网络未连接。请恢复网络后重试；草稿已保留。':!businessConfig.reviewEndpoint?'未配置审核服务，无法获取或提交最新进度。请在正式小程序查看；草稿已保留。':'演示页未接入真实身份认证，请在正式小程序操作。'));return
    }
    if(modal==='contract'){
      if(activeContractId==null||contractStatuses[activeContractId]==='signed'){close();return}
      void run(async()=>{
        try{
          const signer=businessConfig.contractSign
          if(!signer){setMessage('当前未接入合同签署服务，合同仍未签署。请在正式小程序操作，或稍后重试。');return}
          await signContractAndUpdate(activeContractId,signer,id=>setContractStatuses(previous=>({...previous,[id]:'signed'})))
          close();showToast('合同签署成功')
        }catch(error){setMessage(error instanceof Error?`签署失败：${error.message}。合同状态未改变，请重试。`:'签署失败，合同状态未改变。请检查网络后重试。')}
      },'正在签署，请稍候…')
      return
    }
    if(modal==='booking'){setMessage('排班和下单服务未接入；没有提交预约。');return}
    close()
  }
  const openPackageDetails=(id:number)=>{sessionStorage.setItem('consultation-scroll',String(window.scrollY));const url=new URL(location.href);url.searchParams.set('package',String(id));history.pushState({packageId:id},'',url);setPackageId(id);window.scrollTo(0,0)}
  const back=()=>{if(modal){close();return}if(packageId){history.back();return}if(history.length>1)history.back();else showToast('已在当前页面')}
  const selectedPackage=appointments.find(item=>item.id===packageId)
  if(selectedPackage)return <main className="phone"><StatusBar/><Header title="套餐详情" showMenu={false} onMenu={()=>{}} onBack={back}/><section className="package-detail"><h2>{selectedPackage.package}</h2>{selectedPackage.remaining!=null&&<><p>剩余 <b>{selectedPackage.remaining}</b>/{selectedPackage.total} 次</p><div className="progress"><i style={{width:`${selectedPackage.remaining/selectedPackage.total!*100}%`}}/></div></>}<p className="package-detail-note">更多套餐信息以正式服务记录为准。</p></section><div className="home-indicator"/></main>
  return <main className="phone"><StatusBar/><Header onMenu={()=>setMenu(v=>!v)} onBack={back}/>{menu&&<div className="top-menu"><button onClick={()=>{setMenu(false);setNow(Date.now());showToast('状态已刷新')}}>刷新列表</button><button onClick={()=>{setMenu(false);open('records')}}>预约记录</button></div>}<Tabs active={tab} setActive={setTab} onVisitor={()=>open('visitor')}/><div className="cards">{appointments.map(a=><AppointmentCard key={a.id} item={a} contractStatus={contractStatuses[a.id]} now={now} start={start} reviewState={currentReview} reviewDue={reviewDue} busy={busy} onOpen={open} onPackageDetails={openPackageDetails}/>)}</div><CustomerService/><footer>已完成/已取消的咨询请前往 <button onClick={()=>open('records')}>预约记录</button> 中查看</footer><div className="home-indicator"/><Modal kind={modal} onClose={close} onConfirm={confirm} reviewState={currentReview} reviewDue={reviewDue} requestedSlot={appointments.find(item=>item.pending)?.requestedSlot} contractStatus={activeContractId==null?'unsigned':contractStatuses[activeContractId]} message={message} busy={busy} draft={draft} setDraft={setDraft}/>{toast&&<div className="toast" role="status">{toast}</div>}</main>
}
