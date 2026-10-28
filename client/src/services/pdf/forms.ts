import { PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup } from 'pdf-lib';
import { loadPdfLibDoc } from '../../lib/pdf/load';
import type { FormFieldItem } from '../../types/pdf';

/**
 * Extracts all interactive AcroForm fields present in the PDF document
 */
export async function getPdfFormFields(file: File): Promise<FormFieldItem[]> {
  const pdfDoc = await loadPdfLibDoc(file);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  const items: FormFieldItem[] = [];

  for (const field of fields) {
    const name = field.getName();
    const isReadOnly = field.isReadOnly();

    if (field instanceof PDFTextField) {
      items.push({
        name,
        type: 'text',
        value: field.getText() || '',
        readOnly: isReadOnly,
      });
    } else if (field instanceof PDFCheckBox) {
      items.push({
        name,
        type: 'checkbox',
        value: field.isChecked(),
        readOnly: isReadOnly,
      });
    } else if (field instanceof PDFDropdown) {
      items.push({
        name,
        type: 'dropdown',
        value: field.getSelected()[0] || '',
        options: field.getOptions(),
        readOnly: isReadOnly,
      });
    } else if (field instanceof PDFRadioGroup) {
      items.push({
        name,
        type: 'radio',
        value: field.getSelected() || '',
        options: field.getOptions(),
        readOnly: isReadOnly,
      });
    }
  }

  return items;
}

/**
 * Updates interactive AcroForm field values with optional flattening
 */
export async function fillPdfForm(
  file: File,
  fieldValues: Record<string, string | boolean>,
  options?: { flatten?: boolean; onProgress?: (progress: number, message: string) => void }
): Promise<Uint8Array> {
  options?.onProgress?.(20, 'Loading form fields...');
  const pdfDoc = await loadPdfLibDoc(file);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  let count = 0;
  for (const field of fields) {
    const name = field.getName();
    if (name in fieldValues) {
      const val = fieldValues[name];
      try {
        if (field instanceof PDFTextField && typeof val === 'string') {
          field.setText(val);
        } else if (field instanceof PDFCheckBox && typeof val === 'boolean') {
          if (val) field.check();
          else field.uncheck();
        } else if (field instanceof PDFDropdown && typeof val === 'string') {
          field.select(val);
        } else if (field instanceof PDFRadioGroup && typeof val === 'string') {
          field.select(val);
        }
        count++;
      } catch {
        // Continue if particular field option is mismatched
      }
    }
  }

  options?.onProgress?.(70, `Updated ${count} fields...`);

  if (options?.flatten) {
    options.onProgress?.(80, 'Flattening form fields into static page content...');
    form.flatten();
  }

  options?.onProgress?.(90, 'Saving filled PDF...');
  const resultBytes = await pdfDoc.save();
  options?.onProgress?.(100, 'Done!');

  return resultBytes;
}
