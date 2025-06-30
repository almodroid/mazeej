import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface TranslationRow {
  key: string;
  en: string;
  ar: string;
  used: boolean;
  missingEn: boolean;
  missingAr: boolean;
  unused: boolean;
}

type Filter = 'all' | 'missingEn' | 'missingAr' | 'unused' | 'used';

export default function TranslationManager() {
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState<TranslationRow[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editEn, setEditEn] = useState('');
  const [editAr, setEditAr] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);

  // Fetch translation data from API
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/translations");
      if (!res.ok) throw new Error("Failed to load translations");
      const data = await res.json();
      setRows(data.rows || []);
      setSummary(data.summary || {});
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    setScanLoading(true);
    setScanError(null);
    setScanSuccess(false);
    try {
      const res = await fetch("/api/admin/translations/scan", { method: "POST" });
      if (!res.ok) throw new Error("Failed to run scan script");
      setScanSuccess(true);
      // Reload translations after scan
      await fetchData();
    } catch (err: any) {
      setScanError(err.message || "Unknown error");
    } finally {
      setScanLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (row: TranslationRow) => {
    setEditKey(row.key);
    setEditEn(row.en || '');
    setEditAr(row.ar || '');
  };

  const handleSave = async (lang: 'en' | 'ar') => {
    setSaving(true);
    setError(null);
    try {
      const value = lang === 'en' ? editEn : editAr;
      const res = await fetch('/api/admin/translations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: editKey, lang, value }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setRows(rows => rows.map(row =>
        row.key === editKey ? { ...row, [lang]: value, [`missing${lang === 'en' ? 'En' : 'Ar'}`]: !value } : row
      ));
      setEditKey(null);
    } catch (e) {
      setError('Failed to save translation');
    } finally {
      setSaving(false);
    }
  };

  const filteredRows = rows.filter(row => {
    if (filter === 'missingEn') return row.missingEn;
    if (filter === 'missingAr') return row.missingAr;
    if (filter === 'unused') return row.unused;
    if (filter === 'used') return row.used;
    return true;
  }).filter(row =>
    row.key.toLowerCase().includes(search.toLowerCase()) ||
    row.en.toLowerCase().includes(search.toLowerCase()) ||
    row.ar.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto py-8 px-2 md:px-6">
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Translation Manager</CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={handleScan} disabled={scanLoading} variant="outline">
                {scanLoading ? "Scanning..." : "Scan for New Keys"}
              </Button>
              {scanSuccess && <span className="text-green-600 text-sm">Scan complete!</span>}
              {scanError && <span className="text-red-600 text-sm">{scanError}</span>}
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>{t('Error')}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <span className="animate-spin mr-2">🔄</span> {t('Loading...')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>English</TableHead>
                      <TableHead>Arabic</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Edit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map(row => {
                      const isEditing = editKey === row.key;
                      return (
                        <TableRow key={row.key} className={row.missingEn || row.missingAr ? 'bg-yellow-50' : row.unused ? 'bg-gray-50' : ''}>
                          <TableCell className="font-mono text-xs break-all max-w-xs">{row.key}</TableCell>
                          <TableCell>{isEditing ? <Input value={editEn} onChange={e => setEditEn(e.target.value)} /> : row.en}</TableCell>
                          <TableCell>{isEditing ? <Input value={editAr} onChange={e => setEditAr(e.target.value)} /> : row.ar}</TableCell>
                          <TableCell>
                            {row.missingEn && <span className="text-red-600">Missing EN</span>}
                            {row.missingAr && <span className="text-orange-500 ml-2">Missing AR</span>}
                            {row.unused && <span className="text-gray-500 ml-2">Unused</span>}
                            {!row.missingEn && !row.missingAr && !row.unused && <span className="text-green-600">OK</span>}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <div className="flex gap-2">
                                <Button size="sm" disabled={saving} onClick={() => handleSave('en')}>Save EN</Button>
                                <Button size="sm" disabled={saving} onClick={() => handleSave('ar')}>Save AR</Button>
                                <Button size="sm" variant="outline" disabled={saving} onClick={() => setEditKey(null)}>Cancel</Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => handleEdit(row)}>Edit</Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export { TranslationManager }; 