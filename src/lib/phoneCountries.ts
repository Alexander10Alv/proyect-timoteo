export interface PhoneCountry {
  code: string;
  dial: string;
  name: string;
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: 'PER', dial: '+51', name: 'Perú' },
  { code: 'MEX', dial: '+52', name: 'México' },
  { code: 'COL', dial: '+57', name: 'Colombia' },
  { code: 'ARG', dial: '+54', name: 'Argentina' },
  { code: 'ESP', dial: '+34', name: 'España' },
  { code: 'USA', dial: '+1', name: 'Estados Unidos' },
  { code: 'CHL', dial: '+56', name: 'Chile' },
  { code: 'BRA', dial: '+55', name: 'Brasil' },
  { code: 'BOL', dial: '+591', name: 'Bolivia' },
  { code: 'ECU', dial: '+593', name: 'Ecuador' },
  { code: 'PRY', dial: '+595', name: 'Paraguay' },
  { code: 'URY', dial: '+598', name: 'Uruguay' },
  { code: 'VEN', dial: '+58', name: 'Venezuela' },
  { code: 'GTM', dial: '+502', name: 'Guatemala' },
  { code: 'HND', dial: '+504', name: 'Honduras' },
  { code: 'SLV', dial: '+503', name: 'El Salvador' },
  { code: 'NIC', dial: '+505', name: 'Nicaragua' },
  { code: 'CRI', dial: '+506', name: 'Costa Rica' },
  { code: 'PAN', dial: '+507', name: 'Panamá' },
  { code: 'DOM', dial: '+1', name: 'República Dominicana' },
  { code: 'CUB', dial: '+53', name: 'Cuba' },
  { code: 'CAN', dial: '+1', name: 'Canadá' },
  { code: 'GBR', dial: '+44', name: 'Reino Unido' },
  { code: 'DEU', dial: '+49', name: 'Alemania' },
  { code: 'FRA', dial: '+33', name: 'Francia' },
  { code: 'ITA', dial: '+39', name: 'Italia' },
  { code: 'PRT', dial: '+351', name: 'Portugal' },
  { code: 'NLD', dial: '+31', name: 'Países Bajos' },
  { code: 'CHE', dial: '+41', name: 'Suiza' },
  { code: 'AUS', dial: '+61', name: 'Australia' },
  { code: 'JPN', dial: '+81', name: 'Japón' },
];