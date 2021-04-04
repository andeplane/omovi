export interface Color {
    r: number;
    g: number;
    b: number;
}
export interface AtomType {
    fullname: string;
    shortname: string;
    radius: number;
    color: Color;
}
declare const AtomTypes: {
    [key: string]: AtomType;
};
export default AtomTypes;
