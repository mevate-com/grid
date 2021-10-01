export function createField() {

}
export function updateField() {

}
export function deleteField() {

}

interface Field {
    name: string;
    title: string;
    type: FieldTypes;
}

export type FieldTypes = 'string' | 'integer' | 'float' | 'date';
