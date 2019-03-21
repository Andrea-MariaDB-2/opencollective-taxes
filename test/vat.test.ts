import {
  isTierTypeSubjectToVAT,
  vatMayApply,
  getStandardVatRate,
  getVatPercentage,
  checkVATNumberFormat,
  getVatOriginCountry,
} from '../src/vat';

const FRENCH_VAT = 20;
const BELGIUM_VAT = 21;

it('taxes only certain tier types', () => {
  expect(isTierTypeSubjectToVAT('PRODUCT')).toBe(true);
  expect(isTierTypeSubjectToVAT('SERVICE')).toBe(true);
  expect(isTierTypeSubjectToVAT('SUPPORT')).toBe(true);
  expect(isTierTypeSubjectToVAT('TICKET')).toBe(true);

  expect(isTierTypeSubjectToVAT('DONATION')).toBe(false);
  expect(isTierTypeSubjectToVAT('MEMBERSHIP')).toBe(false);
});

describe('getVatOriginCountry', () => {
  test('returns the country where VAT applies based on tier type', () => {
    expect(getVatOriginCountry('PRODUCT', 'FR', 'BE')).toBe('FR');
    expect(getVatOriginCountry('SUPPORT', 'FR', 'BE')).toBe('FR');
    expect(getVatOriginCountry('SERVICE', 'FR', 'BE')).toBe('FR');
    expect(getVatOriginCountry('TICKET', 'FR', 'BE')).toBe('BE');
  });

  test("returns null when VAT doesn't apply", () => {
    expect(getVatOriginCountry('DONATION', 'FR', 'BE')).toBe(null);
    expect(getVatOriginCountry('PRODUCT', 'US', 'US')).toBe(null);
  });
});

describe('vatMayApply', () => {
  it('returns false for non european countries', () => {
    expect(vatMayApply('PRODUCT', 'US')).toBe(false);
    expect(vatMayApply('PRODUCT', 'US')).toBe(false);
  });

  it('returns true for european countries', () => {
    expect(vatMayApply('PRODUCT', 'FR')).toBe(true);
    expect(vatMayApply('PRODUCT', 'BE')).toBe(true);
  });

  it('returns false when tier type is not a taxed type', () => {
    expect(vatMayApply('DONATION', 'FR')).toBe(false);
  });
});

describe('getStandardVatRate', () => {
  it('returns the valud based on the country', () => {
    expect(getStandardVatRate('SERVICE', 'BE')).toBe(BELGIUM_VAT);
    expect(getStandardVatRate('SERVICE', 'FR')).toBe(FRENCH_VAT);
    expect(getStandardVatRate('SUPPORT', 'BE')).toBe(BELGIUM_VAT);
    expect(getStandardVatRate('PRODUCT', 'BE')).toBe(BELGIUM_VAT);
    expect(getStandardVatRate('TICKET', 'BE')).toBe(BELGIUM_VAT);
    expect(getStandardVatRate('DONATION', 'BE')).toBe(0);
  });
});

describe('getVatPercentage', () => {
  describe('has VAT if', () => {
    it('individual is in the same country', () => {
      expect(getVatPercentage('PRODUCT', 'FR', 'FR', false)).toBe(FRENCH_VAT);
    });

    it('it is an individual in a different european country', () => {
      expect(getVatPercentage('PRODUCT', 'FR', 'BE', false)).toBe(FRENCH_VAT);
    });

    it('it is a company in the same country', () => {
      expect(getVatPercentage('PRODUCT', 'FR', 'FR', true)).toBe(FRENCH_VAT);
    });
  });

  describe('has NO VAT if', () => {
    it('it is a company in a different european country', () => {
      expect(getVatPercentage('PRODUCT', 'BE', 'FR', true)).toBe(0);
    });

    it('it is an individual in a different country outside EU', () => {
      expect(getVatPercentage('PRODUCT', 'BE', 'US', false)).toBe(0);
    });

    it('it is a company in a different country outside EU', () => {
      expect(getVatPercentage('PRODUCT', 'BE', 'US', true)).toBe(0);
    });
  });

  it('for events, the place where the event takes place determines the vat', () => {
    expect(getVatPercentage('TICKET', 'BE', 'FR', false)).toBe(BELGIUM_VAT);
    expect(getVatPercentage('TICKET', 'FR', 'FR', false)).toBe(FRENCH_VAT);
  });
});

describe('checkVATNumberFormat', () => {
  it('checks for invalid numbers', () => {
    expect(checkVATNumberFormat('xxx')).toEqual({
      isValid: false,
      value: 'XXX',
    });
  });

  it('returns rich information', () => {
    expect(checkVATNumberFormat('FRXX999999999')).toEqual({
      country: {
        isoCode: {
          long: 'FRA',
          numeric: '250',
          short: 'FR',
        },
        name: 'France',
      },
      isValid: true,
      value: 'FRXX999999999',
    });
  });

  it('formats number', () => {
    expect(checkVATNumberFormat(' FR XX-999999999 ')).toEqual({
      country: {
        isoCode: {
          long: 'FRA',
          numeric: '250',
          short: 'FR',
        },
        name: 'France',
      },
      isValid: true,
      value: 'FRXX999999999',
    });
  });
});
