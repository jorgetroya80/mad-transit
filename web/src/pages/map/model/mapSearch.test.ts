import { validateMapSearch } from './mapSearch';

describe('validateMapSearch', () => {
  it('defaults to bikes without a station when the search is empty', () => {
    expect(validateMapSearch({})).toEqual({ need: 'bikes' });
  });

  it.each(['538', '25A'])('keeps station %s as a string', (station) => {
    expect(validateMapSearch({ station })).toEqual({ station, need: 'bikes' });
  });

  it.each([[''], [538], [null], [['538']]])('drops station %j', (station) => {
    expect(validateMapSearch({ station })).toEqual({ need: 'bikes' });
  });

  it('keeps need docks', () => {
    expect(validateMapSearch({ need: 'docks' })).toEqual({ need: 'docks' });
  });

  it.each(['xyz', '', 1])('treats need %j as bikes', (need) => {
    expect(validateMapSearch({ need })).toEqual({ need: 'bikes' });
  });

  it('keeps service bus', () => {
    expect(validateMapSearch({ service: 'bus' })).toEqual({ need: 'bikes', service: 'bus' });
  });

  it.each(['xyz', '', 1])(
    'treats service %j as bicimad, which the search leaves out',
    (service) => {
      expect(validateMapSearch({ service })).toEqual({ need: 'bikes' });
    },
  );

  it('keeps stop 72 with service bus', () => {
    expect(validateMapSearch({ service: 'bus', stop: '72' })).toEqual({
      need: 'bikes',
      service: 'bus',
      stop: '72',
    });
  });

  it('ignores stop without service bus', () => {
    const search = validateMapSearch({ stop: '72' });

    expect(search).toEqual({ need: 'bikes' });
    expect(search.stop).toBeUndefined();
  });

  it.each([[''], [72], [null]])('drops stop %j with service bus', (stop) => {
    expect(validateMapSearch({ service: 'bus', stop })).toEqual({
      need: 'bikes',
      service: 'bus',
    });
  });

  it('keeps the station next to a bus stop', () => {
    expect(validateMapSearch({ service: 'bus', stop: '72', station: '538' })).toEqual({
      station: '538',
      need: 'bikes',
      service: 'bus',
      stop: '72',
    });
  });
});
