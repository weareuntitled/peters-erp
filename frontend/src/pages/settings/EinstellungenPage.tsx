import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Tab } from '@headlessui/react';
import { PhotoIcon, TrashIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import apiClient, { API_BASE_URL } from '../../api/apiClient';
import { useToast } from '../../components/ui/Toast';

const BACKEND_URL = API_BASE_URL.replace('/api', '');

interface FirmenEinstellungen {
  firmenname?: string;
  inhaber_geschaeftsfuehrer?: string;
  strasse?: string;
  plz?: string;
  ort?: string;
  telefon?: string;
  mobiltelefon?: string;
  email?: string;
  website?: string;
  bankname?: string;
  iban?: string;
  bic?: string;
  steuernummer?: string;
  ust_id_nr?: string;
  registergericht?: string;
  registernummer?: string;
  handwerkskammer?: string;
  betriebsnummer?: string;
  praefix_angebot: string;
  praefix_rechnung: string;
  standard_zahlungsziel: number;
  standard_mwst_satz: number;
  einleitung_angebot?: string;
  schlusstext_rechnung?: string;
  text_35a?: string;
  info_freistellung?: string;
  umsatzziel_monat: number;
  umsatzziel_jahr: number;
  logo_pfad?: string;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const EinstellungenPage = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [logo, setLogo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { register, handleSubmit, reset, setValue, watch } = useForm<FirmenEinstellungen>({
    defaultValues: {
      praefix_angebot: 'AN-',
      praefix_rechnung: 'RE-',
      standard_zahlungsziel: 14,
      standard_mwst_satz: 19.0,
      umsatzziel_monat: 0,
      umsatzziel_jahr: 0,
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiClient.get('/firmen-einstellungen/');
        reset(response.data);
        if (response.data.logo_pfad) {
          setLogo(`${BACKEND_URL}${response.data.logo_pfad}`);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching settings:', error);
        addToast('Fehler beim Laden der Einstellungen', 'error');
        setLoading(false);
      }
    };

    fetchSettings();
  }, [reset, addToast]);

  const onSave = async (data: FirmenEinstellungen) => {
    try {
      await apiClient.put('/firmen-einstellungen/', data);
      addToast('Einstellungen erfolgreich gespeichert', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      addToast('Fehler beim Speichern der Einstellungen', 'error');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      addToast('Datei zu groß (max. 2MB)', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/firmen-einstellungen/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setLogo(`${BACKEND_URL}${response.data.logo_pfad}`);
      addToast('Logo erfolgreich hochgeladen', 'success');
    } catch (error) {
      console.error('Error uploading logo:', error);
      addToast('Fehler beim Logo-Upload', 'error');
    }
  };

  const handleLogoDelete = async () => {
    try {
      await apiClient.delete('/firmen-einstellungen/logo');
      setLogo(null);
      addToast('Logo entfernt', 'success');
    } catch (error) {
      console.error('Error deleting logo:', error);
      addToast('Fehler beim Entfernen des Logos', 'error');
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Lade Einstellungen...</div>;
  }

  const tabs = [
    { name: 'Allgemein', key: 'allgemein' },
    { name: 'Steuern & Recht', key: 'recht' },
    { name: 'Bank', key: 'bank' },
    { name: 'PDF-Texte', key: 'texte' },
    { name: 'Nummernkreise', key: 'nummern' },
    { name: 'SMTP & E-Mail', key: 'smtp' },
    { name: 'KPIs', key: 'kpis' },
  ];

  return (
    <div className="flex flex-col gap-6 pb-12">
      <h1 className="font-heading text-xl font-bold text-sky-950">Firmen-Einstellungen</h1>

      {/* 1. Visuelles Erscheinungsbild (GANZ OBEN) */}
      <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-4 text-sm font-semibold text-slate-700 uppercase tracking-wider">Visuelles Erscheinungsbild</h2>
        <div className="flex items-center gap-8">
          <div className="relative h-32 w-64 flex-shrink-0 overflow-hidden rounded-md border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
            {logo ? (
              <img src={logo} alt="Firmenlogo" className="h-full w-full object-contain" />
            ) : (
              <div className="text-center">
                <PhotoIcon className="mx-auto h-10 w-10 text-slate-300" />
                <span className="mt-2 block text-xs text-slate-400">Kein Logo</span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 transition-colors"
              >
                <ArrowUpTrayIcon className="h-4 w-4" />
                Logo hochladen
              </button>
              {logo && (
                <button
                  type="button"
                  onClick={handleLogoDelete}
                  className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50 transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                  Löschen
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Erlaubt: PNG, JPG, WEBP, SVG. Max. 2MB. <br />
              Wird auf Angeboten und Rechnungen oben rechts platziert.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLogoUpload}
              className="hidden"
              accept=".png,.jpg,.jpeg,.webp,.svg"
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSave)}>
        <Tab.Group>
          <div className="mb-4 border-b border-slate-200">
            <Tab.List className="flex gap-8">
              {tabs.map((tab) => (
                <Tab
                  key={tab.key}
                  className={({ selected }) =>
                    classNames(
                      'pb-4 text-sm font-medium outline-none transition-colors border-b-2',
                      selected
                        ? 'border-sky-500 text-sky-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    )
                  }
                >
                  {tab.name}
                </Tab>
              ))}
            </Tab.List>
          </div>

          <Tab.Panels>
            {/* Allgemein */}
            <Tab.Panel className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <h3 className="text-sm font-semibold text-slate-800">Unternehmen & Kontakt</h3>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Firmenname (inkl. Rechtsform)</label>
                      <input {...register('firmenname')} type="text" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" placeholder="Muster GmbH" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Inhaber / Geschäftsführer</label>
                      <input {...register('inhaber_geschaeftsfuehrer')} type="text" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-500 mb-1">E-Mail</label>
                        <input {...register('email')} type="email" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Website</label>
                        <input {...register('website')} type="text" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <h3 className="text-sm font-semibold text-slate-800">Anschrift & Telefon</h3>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Straße & Nr.</label>
                      <input {...register('strasse')} type="text" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">PLZ</label>
                        <input {...register('plz')} type="text" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Ort</label>
                        <input {...register('ort')} type="text" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Telefon</label>
                        <input {...register('telefon')} type="text" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Mobil</label>
                        <input {...register('mobiltelefon')} type="text" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tab.Panel>

            {/* Steuern & Recht */}
            <Tab.Panel className="animate-in fade-in duration-300">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <h3 className="text-sm font-semibold text-slate-800">Steuerdaten</h3>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Steuernummer</label>
                      <input {...register('steuernummer')} type="text" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">USt-IdNr.</label>
                      <input {...register('ust_id_nr')} type="text" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <h3 className="text-sm font-semibold text-slate-800">Handelsregister & Kammer</h3>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Registergericht</label>
                        <input {...register('registergericht')} type="text" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" placeholder="z.B. Amtsgericht Augsburg" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Registernummer</label>
                        <input {...register('registernummer')} type="text" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" placeholder="z.B. HRB 12345" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Handwerkskammer (HWK)</label>
                        <input {...register('handwerkskammer')} type="text" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Betriebsnummer</label>
                        <input {...register('betriebsnummer')} type="text" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tab.Panel>

            {/* Bank */}
            <Tab.Panel className="animate-in fade-in duration-300">
              <div className="max-w-2xl space-y-4 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h3 className="text-sm font-semibold text-slate-800">Bankverbindung</h3>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Bankname</label>
                    <input {...register('bankname')} type="text" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">IBAN</label>
                      <input {...register('iban')} type="text" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">BIC</label>
                      <input {...register('bic')} type="text" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                    </div>
                  </div>
                </div>
              </div>
            </Tab.Panel>

            {/* PDF-Texte */}
            <Tab.Panel className="animate-in fade-in duration-300">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <h3 className="text-sm font-semibold text-slate-800">Angebote & Rechnungen</h3>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Standard-Einleitung Angebot</label>
                      <textarea {...register('einleitung_angebot')} rows={4} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none resize-none" placeholder="Vielen Dank für Ihre Anfrage..." />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Standard-Schlusstext Rechnung</label>
                      <textarea {...register('schlusstext_rechnung')} rows={4} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none resize-none" placeholder="Wir bedanken uns für den Auftrag..." />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <h3 className="text-sm font-semibold text-slate-800">Zusatztexte (z.B. für Handwerker)</h3>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Text für § 35a EStG (Handwerkerleistung)</label>
                      <textarea {...register('text_35a')} rows={4} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none resize-none" placeholder="Hinweis auf steuerliche Absetzbarkeit..." />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Info zur Freistellungsbescheinigung</label>
                      <textarea {...register('info_freistellung')} rows={4} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none resize-none" />
                    </div>
                  </div>
                </div>
              </div>
            </Tab.Panel>

            {/* Nummernkreise */}
            <Tab.Panel className="animate-in fade-in duration-300">
              <div className="max-w-2xl space-y-4 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h3 className="text-sm font-semibold text-slate-800">Nummern & Fristen</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Präfix Angebot</label>
                      <input {...register('praefix_angebot')} type="text" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Präfix Rechnung</label>
                      <input {...register('praefix_rechnung')} type="text" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Standard-Zahlungsziel (Tage)</label>
                      <input {...register('standard_zahlungsziel', { valueAsNumber: true })} type="number" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Standard MwSt-Satz (%)</label>
                      <input {...register('standard_mwst_satz', { valueAsNumber: true })} type="number" step="0.1" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                    </div>
                  </div>
                </div>
              </div>
            </Tab.Panel>


            {/* SMTP & E-Mail */}
            <Tab.Panel className="animate-in fade-in duration-300">
              <div className="max-w-2xl space-y-4 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-slate-800">SMTP Server Einstellungen</h3>
                  <span className="text-xs text-slate-500">Konfiguration für ausgehende E-Mails via /send</span>
                </div>
                
                <div className="rounded bg-sky-50 p-4 border border-sky-100 mb-6">
                  <p className="text-xs text-sky-800">
                    <strong>Hinweis:</strong> Die SMTP-Einstellungen werden aktuell aus Sicherheitsgründen noch nicht in der Datenbank gespeichert, 
                    sondern direkt über die Umgebungsvariablen (.env) im Backend-Container geladen (SMTP_HOST, SMTP_USER, etc.).
                    Dieser Tab dient vorerst nur zum Testen der Verbindung.
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Verbindungstest</h4>
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Test-Empfänger E-Mail</label>
                      <input
                        id="test-email"
                        type="email"
                        placeholder="test@example.com"
                        className="w-full rounded-md border-0 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-sky-600"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const email = (document.getElementById('test-email') as HTMLInputElement).value;
                        if (!email) return alert('Bitte E-Mail eingeben');
                        
                        try {
                          const res = await apiClient.post('/settings/test-smtp', { email });
                          alert('E-Mail erfolgreich versendet: ' + res.data.message);
                        } catch (e: any) {
                          alert('Fehler beim Senden: ' + (e.response?.data?.detail || e.message));
                        }
                      }}
                      className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800"
                    >
                      Test-E-Mail senden
                    </button>
                  </div>
                </div>
              </div>
            </Tab.Panel>

            {/* KPIs */}
            <Tab.Panel className="animate-in fade-in duration-300">
              <div className="max-w-md space-y-4 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h3 className="text-sm font-semibold text-slate-800">Wirtschaftliche Ziele</h3>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Monatliches Umsatzziel (€)</label>
                    <input {...register('umsatzziel_monat', { valueAsNumber: true })} type="number" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Jährliches Umsatzziel (€)</label>
                    <input {...register('umsatzziel_jahr', { valueAsNumber: true })} type="number" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Diese Werte werden im Dashboard verwendet, um den Fortschritt gegenüber den Zielen zu visualisieren.
                  </p>
                </div>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-sky-500 px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 transition-colors"
          >
            Alle Änderungen speichern
          </button>
        </div>
      </form>
    </div>
  );
};

export default EinstellungenPage;
