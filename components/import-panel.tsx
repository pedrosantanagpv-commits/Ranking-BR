"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileSpreadsheet, UploadCloud, X } from "lucide-react";

export function ImportPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const chooseFile = (selected?: File) => {
    if (selected) setFile(selected);
  };

  return (
    <div className="two-column-layout">
      <section className="panel import-card">
        <div className="panel__header">
          <div><span className="section-kicker">Etapa 1 de 3</span><h3>Adicionar relatório</h3></div>
        </div>
        <button
          className="dropzone"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            chooseFile(event.dataTransfer.files[0]);
          }}
        >
          <span className="dropzone__icon"><UploadCloud size={30} /></span>
          <strong>Arraste o relatório para cá</strong>
          <span>ou clique para selecionar o arquivo</span>
          <small>Formatos aceitos: .xls e .xlsx</small>
        </button>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(event) => chooseFile(event.target.files?.[0])}
        />

        {file ? (
          <div className="selected-file">
            <FileSpreadsheet size={26} />
            <div><strong>{file.name}</strong><span>{(file.size / 1024).toFixed(1)} KB • pronto para leitura</span></div>
            <button className="icon-button" aria-label="Remover arquivo" onClick={() => setFile(null)}><X size={18} /></button>
          </div>
        ) : (
          <div className="empty-file-note">Nenhum arquivo selecionado.</div>
        )}

        <div className="form-actions">
          <button className="button button--ghost" onClick={() => setFile(null)}>Limpar</button>
          <button className="button button--primary" disabled={!file}>Processar relatório</button>
        </div>
        <p className="feature-note">A leitura e consolidação do relatório serão ativadas na v0.2.0. Nesta versão, o fluxo de seleção já está preparado.</p>
      </section>

      <aside className="panel guide-card">
        <span className="section-kicker">Como funciona</span>
        <h3>Do Excel ao ranking</h3>
        <ol className="step-list">
          <li><span>1</span><div><strong>Envie o relatório</strong><p>Use o mesmo arquivo exportado pelo sistema atual.</p></div></li>
          <li><span>2</span><div><strong>Valide os dados</strong><p>Confira registros, cooperativas e novos executivos.</p></div></li>
          <li><span>3</span><div><strong>Confirme o fechamento</strong><p>O histórico só muda depois da sua confirmação.</p></div></li>
        </ol>
        <div className="security-box"><CheckCircle2 size={20} /><span>O arquivo nunca altera o histórico antes da confirmação.</span></div>
      </aside>
    </div>
  );
}
