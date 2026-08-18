'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '@/components/admin/AdminNav';
import { Upload, ArrowLeft, CheckCircle2, AlertCircle, Loader2, FileSpreadsheet } from 'lucide-react';

interface CSVRow {
  nombre: string;
  marca: string;
  tipo: string;
  genero: string;
  precio: number;
  talle: number;
  stock: number;
  imagenUrl?: string;
  descripcion?: string;
}

export default function CSVImportPage() {
  const router = useRouter();

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<CSVRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Result summary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [summary, setSummary] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setLoading(true);
    setErrorMsg('');
    setSummary(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

        if (lines.length < 2) {
          throw new Error('El archivo CSV está vacío o no contiene encabezados.');
        }

        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

        const rows: CSVRow[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map((v) => v.trim());
          if (values.length < 4) continue;

          // Mapping header indexes
          const nombreIdx = headers.indexOf('nombre');
          const marcaIdx = headers.indexOf('marca');
          const tipoIdx = headers.indexOf('tipo');
          const generoIdx = headers.indexOf('genero');
          const precioIdx = headers.indexOf('precio');
          const talleIdx = headers.indexOf('talle');
          const stockIdx = headers.indexOf('stock');
          const imgIdx = headers.indexOf('imagenurl');
          const descIdx = headers.indexOf('descripcion');

          const row: CSVRow = {
            nombre: values[nombreIdx >= 0 ? nombreIdx : 0] || '',
            marca: values[marcaIdx >= 0 ? marcaIdx : 1] || '',
            tipo: values[tipoIdx >= 0 ? tipoIdx : 2] || '',
            genero: values[generoIdx >= 0 ? generoIdx : 3] || 'Hombre',
            precio: parseFloat(values[precioIdx >= 0 ? precioIdx : 4]) || 0,
            talle: parseInt(values[talleIdx >= 0 ? talleIdx : 5], 10) || 40,
            stock: parseInt(values[stockIdx >= 0 ? stockIdx : 6], 10) || 0,
            imagenUrl: imgIdx >= 0 ? values[imgIdx] : undefined,
            descripcion: descIdx >= 0 ? values[descIdx] : undefined,
          };

          rows.push(row);
        }

        setParsedRows(rows);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Error al procesar el archivo CSV');
        setParsedRows([]);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;

    setProcessing(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/products/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsedRows }),
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message || 'Error durante la importación');
      }

      setSummary(json.summary);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error procesando la importación');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#111111] font-sans">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-[#e5e5e5]">
          <button
            onClick={() => router.push('/admin/products')}
            className="text-xs font-bold text-[#111111] hover:text-[#707072] flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a Productos
          </button>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold uppercase tracking-tight text-[#111111] flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7" /> Importación Masiva de Stock en CSV
          </h1>
          <p className="text-xs text-[#707072] mt-1">
            Cargá o actualizá productos en lote subiendo un archivo CSV con formato estándar.
          </p>
        </div>

        {/* CSV Format Reference Box */}
        <div className="bg-white border border-[#e5e5e5] p-4 text-xs space-y-2 shadow-sm">
          <h3 className="font-extrabold uppercase tracking-wider text-[#111111]">
            Estructura del archivo CSV esperada:
          </h3>
          <code className="block bg-[#f5f5f5] p-3 text-[11px] font-mono text-[#111111] overflow-x-auto border border-[#e5e5e5]">
            nombre,marca,tipo,genero,precio,talle,stock,imagenUrl,descripcion<br />
            Air Max 90,Nike,Running,Hombre,120000,42,10,https://...,Zapato running<br />
            UltraBoost,Adidas,Deportiva,Mujer,135000,38,5,https://...,Amortiguación
          </code>
        </div>

        {/* Upload Zone */}
        <div className="bg-white border-2 border-dashed border-[#e5e5e5] p-8 text-center space-y-4 hover:border-[#111111] transition-colors">
          <Upload className="w-10 h-10 text-[#707072] mx-auto" />
          <div>
            <label className="cursor-pointer py-3 px-6 bg-[#111111] hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-full inline-block shadow-md">
              Seleccionar Archivo CSV
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
          {csvFile && (
            <p className="text-xs font-bold text-[#111111]">
              Archivo seleccionado: <strong>{csvFile.name}</strong> ({parsedRows.length} filas detectadas)
            </p>
          )}
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-4 bg-[#d30005]/10 border border-[#d30005] text-[#d30005] text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Results Summary Box */}
        {summary && (
          <div className="bg-white border border-[#e5e5e5] p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-extrabold uppercase tracking-tight text-[#007d48] flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" /> Resultado de la Importación
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-[#f5f5f5] border border-[#e5e5e5]">
                <span className="text-[10px] font-bold text-[#707072] uppercase block">
                  Filas Procesadas
                </span>
                <span className="text-xl font-extrabold text-[#111111]">
                  {summary.totalRows}
                </span>
              </div>

              <div className="p-3 bg-[#007d48]/10 border border-[#007d48]/30">
                <span className="text-[10px] font-bold text-[#007d48] uppercase block">
                  Productos Creados
                </span>
                <span className="text-xl font-extrabold text-[#007d48]">
                  {summary.createdCount}
                </span>
              </div>

              <div className="p-3 bg-[#f5f5f5] border border-[#e5e5e5]">
                <span className="text-[10px] font-bold text-[#707072] uppercase block">
                  Stock Actualizado
                </span>
                <span className="text-xl font-extrabold text-[#111111]">
                  {summary.updatedCount}
                </span>
              </div>

              <div className="p-3 bg-[#d30005]/10 border border-[#d30005]/30">
                <span className="text-[10px] font-bold text-[#d30005] uppercase block">
                  Errores
                </span>
                <span className="text-xl font-extrabold text-[#d30005]">
                  {summary.errorCount}
                </span>
              </div>
            </div>

            {summary.errors && summary.errors.length > 0 && (
              <div className="p-3 bg-[#f5f5f5] border border-[#e5e5e5] space-y-1 text-xs text-[#d30005]">
                <h4 className="font-bold">Detalle de Errores:</h4>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  {summary.errors.map((errStr: string, idx: number) => (
                    <li key={idx}>{errStr}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Rows Preview Table */}
        {parsedRows.length > 0 && !summary && (
          <div className="bg-white border border-[#e5e5e5] p-6 space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-extrabold uppercase tracking-tight text-[#111111]">
                Vista Previa ({parsedRows.length} productos / variaciones)
              </h2>

              <button
                onClick={handleImport}
                disabled={processing}
                className="py-3 px-6 bg-[#111111] hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-full flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
                  </>
                ) : (
                  'Confirmar e Importar Todo'
                )}
              </button>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f5f5f5] text-[#111111] uppercase font-extrabold border-b border-[#e5e5e5] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Nombre</th>
                    <th className="py-2.5 px-3">Marca</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Género</th>
                    <th className="py-2.5 px-3 text-right">Precio</th>
                    <th className="py-2.5 px-3 text-center">Talle</th>
                    <th className="py-2.5 px-3 text-center">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5e5]">
                  {parsedRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#f5f5f5]">
                      <td className="py-2 px-3 text-[#707072] font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 font-bold text-[#111111]">{row.nombre}</td>
                      <td className="py-2 px-3">{row.marca}</td>
                      <td className="py-2 px-3">{row.tipo}</td>
                      <td className="py-2 px-3 font-semibold">{row.genero}</td>
                      <td className="py-2 px-3 text-right font-bold">${row.precio.toLocaleString('es-AR')}</td>
                      <td className="py-2 px-3 text-center font-bold">{row.talle}</td>
                      <td className="py-2 px-3 text-center font-extrabold">{row.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
