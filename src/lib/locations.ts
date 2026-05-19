export interface Pais {
  nombre: string;
  codigo: string;
}

export const PAISES: Pais[] = [
  { nombre: "Colombia", codigo: "CO" },
  { nombre: "Venezuela", codigo: "VE" },
  { nombre: "Ecuador", codigo: "EC" },
  { nombre: "Perú", codigo: "PE" },
  { nombre: "Bolivia", codigo: "BO" },
  { nombre: "Chile", codigo: "CL" },
  { nombre: "Argentina", codigo: "AR" },
  { nombre: "Uruguay", codigo: "UY" },
  { nombre: "Paraguay", codigo: "PY" },
  { nombre: "Brasil", codigo: "BR" },
  { nombre: "México", codigo: "MX" },
  { nombre: "Panamá", codigo: "PA" },
  { nombre: "Costa Rica", codigo: "CR" },
  { nombre: "Guatemala", codigo: "GT" },
  { nombre: "Honduras", codigo: "HN" },
  { nombre: "El Salvador", codigo: "SV" },
  { nombre: "Nicaragua", codigo: "NI" },
  { nombre: "Cuba", codigo: "CU" },
  { nombre: "República Dominicana", codigo: "DO" },
  { nombre: "España", codigo: "ES" },
  { nombre: "Estados Unidos", codigo: "US" },
];

export const DEPARTAMENTOS_COLOMBIA: Record<string, string[]> = {
  "Amazonas":                    ["Leticia", "Puerto Nariño"],
  "Antioquia":                   ["Medellín", "Bello", "Itagüí", "Envigado", "Apartadó", "Caucasia", "Turbo", "Rionegro", "Sabaneta"],
  "Arauca":                      ["Arauca", "Arauquita", "Saravena", "Tame"],
  "Atlántico":                   ["Barranquilla", "Soledad", "Malambo", "Sabanalarga", "Baranoa", "Puerto Colombia"],
  "Bogotá D.C.":                 ["Bogotá"],
  "Bolívar":                     ["Cartagena", "Magangué", "El Carmen de Bolívar", "Mompox", "Turbaco"],
  "Boyacá":                      ["Tunja", "Duitama", "Sogamoso", "Chiquinquirá", "Puerto Boyacá"],
  "Caldas":                      ["Manizales", "La Dorada", "Chinchiná", "Villamaría", "Riosucio"],
  "Caquetá":                     ["Florencia", "San Vicente del Caguán", "El Doncello"],
  "Casanare":                    ["Yopal", "Aguazul", "Paz de Ariporo", "Villanueva"],
  "Cauca":                       ["Popayán", "Santander de Quilichao", "Puerto Tejada", "Patía"],
  "Cesar":                       ["Valledupar", "Aguachica", "Bosconia", "Codazzi"],
  "Chocó":                       ["Quibdó", "Istmina", "Tadó", "Condoto"],
  "Córdoba":                     ["Montería", "Cereté", "Lorica", "Sahagún", "Montelíbano"],
  "Cundinamarca":                ["Soacha", "Zipaquirá", "Facatativá", "Chía", "Mosquera", "Madrid", "Fusagasugá", "Girardot"],
  "Guainía":                     ["Inírida"],
  "Guaviare":                    ["San José del Guaviare", "Calamar"],
  "Huila":                       ["Neiva", "Pitalito", "Garzón", "La Plata", "Campoalegre"],
  "La Guajira":                  ["Riohacha", "Maicao", "Uribia", "Manaure"],
  "Magdalena":                   ["Santa Marta", "Ciénaga", "Fundación", "El Banco"],
  "Meta":                        ["Villavicencio", "Acacías", "Granada", "Puerto López"],
  "Nariño":                      ["Pasto", "Tumaco", "Ipiales", "Túquerres", "La Unión"],
  "Norte de Santander":          ["Cúcuta", "Ocaña", "Pamplona", "Los Patios", "Villa del Rosario"],
  "Putumayo":                    ["Mocoa", "Puerto Asís", "Orito", "Valle del Guamuez"],
  "Quindío":                     ["Armenia", "Calarcá", "Montenegro", "Quimbaya"],
  "Risaralda":                   ["Pereira", "Dosquebradas", "Santa Rosa de Cabal", "La Virginia"],
  "San Andrés y Providencia":    ["San Andrés", "Providencia"],
  "Santander":                   ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja", "San Gil"],
  "Sucre":                       ["Sincelejo", "Corozal", "Sampués", "Tolú"],
  "Tolima":                      ["Ibagué", "Espinal", "Melgar", "Honda", "Líbano", "Chaparral"],
  "Valle del Cauca":             ["Cali", "Buenaventura", "Palmira", "Tuluá", "Buga", "Cartago", "Jamundí", "Yumbo"],
  "Vaupés":                      ["Mitú"],
  "Vichada":                     ["Puerto Carreño"],
};

export function getDepartamentos(codigoPais: string): string[] {
  if (codigoPais === "CO") return Object.keys(DEPARTAMENTOS_COLOMBIA).sort();
  return [];
}

export function getCiudades(codigoPais: string, departamento: string): string[] {
  if (codigoPais === "CO" && departamento) {
    return DEPARTAMENTOS_COLOMBIA[departamento] ?? [];
  }
  return [];
}
