import { localize, translate } from '../i18n';
import type { Locale } from '../i18n';
import type { FieldEvidence, LocalizedText } from '../types';
export function Localized({value,locale}:{value:LocalizedText|undefined;locale:Locale}) {return <>{localize(value,locale)}{!value?.[locale]?.trim() && <span className="field-warning">{translate(locale,'missingTranslation')}</span>}</>;}
export function Evidence({evidence,locale}:{evidence:FieldEvidence|undefined;locale:Locale}) {const status=evidence?.status||'unverified';return <span className={`evidence ${status}`}>{translate(locale,status==='verified'?'verified':status==='conflict'?'conflict':'unverified')}</span>;}
