"use client";

import { useState } from "react";

type ChoiceProps = {
  name: string;
  label: string;
  options: Record<string, string>;
};

export function ChoiceField({ name, label, options, value }: ChoiceProps & { value: string }) {
  return <label>{label}
    <select name={name} defaultValue={value}>
      {Object.entries(options).map(([code, text]) => <option key={code} value={code}>{text}</option>)}
    </select>
  </label>;
}

export function MultipleChoiceField({ name, label, options, values }: ChoiceProps & { values: string[] }) {
  const [selected, setSelected] = useState(values);
  const choices = Object.entries(options);
  const extraLanguages = name === "languages" ? values.filter(code => !options[code]) : [];

  return <fieldset className="staff-multiple-choice">
    <legend>{label}</legend>
    <details>
      <summary>{selected.filter(code => options[code]).map(code => options[code]).join(", ") || "Selecionar opções"}</summary>
      <div className="staff-choice-list">
        {choices.map(([code, text]) => <label key={code}>
          <input type="checkbox" name={name} value={code} checked={selected.includes(code)}
            onChange={event => setSelected(event.target.checked ? [...selected, code] : selected.filter(item => item !== code))} />
          {text}
        </label>)}
      </div>
    </details>
    {name === "languages" && <label>Outros idiomas ou variantes (BCP 47)
      <input name="additional_languages" defaultValue={extraLanguages.join(", ")} placeholder="Ex.: ar, en-GB, zh-Hant" />
    </label>}
  </fieldset>;
}
