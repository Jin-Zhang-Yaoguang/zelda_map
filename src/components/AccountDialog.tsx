import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { translate } from '../i18n';
import type { Locale } from '../i18n';
import { Icon } from './Icon';
let focusReturnGeneration=0;
export function cancelAccountFocusReturn(){focusReturnGeneration++;}
function validReturnTarget(element:HTMLElement|null){return !!element&&element!==document.body&&element!==document.documentElement&&element.isConnected&&!element.closest('[inert]')&&!element.matches(':disabled')&&!element.classList.contains('sr-only')&&!!element.getClientRects().length&&getComputedStyle(element).visibility!=='hidden';}
export function restoreAccountFocus(resolve:()=>HTMLElement|null){
  const generation=++focusReturnGeneration;const started=performance.now();
  const attempt=()=>{
    if(generation!==focusReturnGeneration||document.querySelector('[role="dialog"][aria-modal="true"]'))return;
    const active=document.activeElement as HTMLElement|null;
    if(validReturnTarget(active))return;
    const target=resolve();
    if(validReturnTarget(target)){target!.focus({preventScroll:true});return;}
    if(target?.isConnected&&target.matches(':disabled')&&performance.now()-started<500){setTimeout(attempt,25);return;}
    for(const id of ['account-status-link','settings-nav','account-section','shrine-search']){const fallback=document.getElementById(id);if(validReturnTarget(fallback)){fallback!.focus({preventScroll:true});return;}}
  };
  setTimeout(attempt,0);
}
export default function AccountDialog({title,locale,onClose,children,returnFocus}:{title:string;locale:Locale;onClose:()=>void;children:ReactNode;returnFocus?:()=>HTMLElement|null}) {
  const ref=useRef<HTMLDivElement>(null);const close=useRef(onClose);close.current=onClose;const returnTarget=useRef(returnFocus);returnTarget.current=returnFocus;
  useEffect(()=>{
    cancelAccountFocusReturn();
    const original=document.activeElement as HTMLElement|null;
    const backdrop=ref.current?.parentElement;
    const siblings=backdrop?.parentElement?Array.from(backdrop.parentElement.children).filter(node=>node!==backdrop) as HTMLElement[]:[];
    const previous=siblings.map(element=>element.inert);siblings.forEach(element=>{element.inert=true;});
    ref.current?.querySelector<HTMLElement>('#account-dialog-title')?.focus();
    const handler=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();close.current();}
      if(event.key==='Tab'&&ref.current){const elements=Array.from(ref.current.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href],[tabindex="0"]')).filter(element=>element.getClientRects().length);const first=elements[0],last=elements.at(-1);const active=document.activeElement;
        if(!first){event.preventDefault();return;}
        if(event.shiftKey&&(active===first||active===document.getElementById('account-dialog-title')||!ref.current.contains(active))){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&(active===last||!ref.current.contains(active))){event.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown',handler);return()=>{document.removeEventListener('keydown',handler);siblings.forEach((element,i)=>{element.inert=previous[i];});restoreAccountFocus(returnTarget.current||(()=>original));};
  },[]);
  return <div className="modal-backdrop"><div ref={ref} className="import-dialog account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-dialog-title"><div className="dialog-heading"><h2 id="account-dialog-title" tabIndex={-1}>{title}</h2><button className="icon-button" onClick={onClose} aria-label={translate(locale,'close')}><Icon name="close"/></button></div>{children}</div></div>;
}
