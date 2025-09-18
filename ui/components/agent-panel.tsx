"use client";

import { useState, useEffect } from "react";
import { Bot, Save, FileText } from "lucide-react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";
import "@/app/prism-theme.css";
import { getConfigFiles, saveConfigFile, ConfigFile } from "@/lib/api";

export function AgentPanel() {
  const [configFiles, setConfigFiles] = useState<ConfigFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ConfigFile | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [notification, setNotification] = useState<string>("");

  useEffect(() => {
    async function fetchFiles() {
      setIsLoading(true);
      const files = await getConfigFiles();
      setConfigFiles(files);
      if (files.length > 0) {
        handleFileSelect(files[0].name, files);
      }
      setIsLoading(false);
    }
    fetchFiles();
  }, []);

  const handleFileSelect = (fileName: string, files: ConfigFile[]) => {
    const file = files.find((f) => f.name === fileName);
    if (file) {
      setSelectedFile(file);
      setFileContent(file.content);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;

    setIsSaving(true);
    setNotification("");
    const success = await saveConfigFile({
      name: selectedFile.name,
      content: fileContent,
    });
    setIsSaving(false);

    if (success) {
      setNotification("¡Archivo guardado con éxito!");
      // Actualizar la lista de archivos para reflejar los cambios
      const updatedFiles = await getConfigFiles();
      setConfigFiles(updatedFiles);
    } else {
      setNotification("Error al guardar el archivo.");
    }

    // Ocultar notificación después de 3 segundos
    setTimeout(() => setNotification(""), 3000);
  };

  return (
    <div className="w-3/5 h-full flex flex-col border-r border-gray-200 bg-white rounded-xl shadow-sm">
      <div className="bg-blue-600 text-white h-12 px-4 flex items-center gap-3 shadow-sm rounded-t-xl shrink-0">
        <Bot className="h-5 w-5" />
        <h1 className="font-semibold text-sm sm:text-base lg:text-lg">
          Editor de Configuración
        </h1>
        <span className="ml-auto text-xs font-light tracking-wide opacity-80">
          Medilink Orchestrator
        </span>
      </div>

      <div className="flex-1 flex flex-col p-4 bg-gray-50/50 min-h-0">
        <div className="mb-4 shrink-0">
          <label htmlFor="file-select" className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
            <FileText className="h-4 w-4" />
            Seleccionar Archivo de Configuración:
          </label>
          <select
            id="file-select"
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            onChange={(e) => handleFileSelect(e.target.value, configFiles)}
            value={selectedFile?.name || ""}
            disabled={isLoading || configFiles.length === 0}
          >
            {isLoading ? (
              <option>Cargando archivos...</option>
            ) : (
              configFiles.map((file) => (
                <option key={file.name} value={file.name}>
                  {file.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex-1 w-full font-mono text-sm border border-gray-300 rounded-md shadow-sm overflow-auto min-h-0">
          <Editor
            value={fileContent}
            onValueChange={setFileContent}
            highlight={(code) => {
              const lang = selectedFile?.name.endsWith('.js') ? 'js' : 'json';
              return highlight(code, languages[lang] || languages.clike, lang);
            }}
            padding={12}
            placeholder={selectedFile ? "Contenido del archivo..." : "Seleccione un archivo para editar."}
            disabled={!selectedFile}
            className="bg-white"
            style={{
              fontFamily: '"Fira code", "Fira Mono", monospace',
              fontSize: 14,
              outline: 'none',
            }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between shrink-0">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={!selectedFile || isSaving}
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </button>
          {notification && (
            <div className={`text-sm ${notification.includes("Error") ? "text-red-600" : "text-green-600"}`}>
              {notification}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}