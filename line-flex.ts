// deno-lint-ignore-file no-explicit-any
import dayjs from 'https://cdn.skypack.dev/dayjs@1.11.4';

export default (msg: string, movies: CinemaItem[]) => {
  const flex: any = movies.map((e) => {
    const poster: any = [
      {
        type: 'image',
        url: e.cover,
        size: 'full',
        aspectMode: 'cover',
        aspectRatio: '120:190',
        gravity: 'center',
        flex: 1,
      }
    ];

    if (e.theater.includes('major')) {
      poster.push({
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'text',
            text: 'Major',
            size: 'xxs',
            color: '#ffffff',
            align: 'center',
            gravity: 'center',
          },
        ],
        backgroundColor: '#dc3545cc',
        paddingAll: '2px',
        paddingEnd: '4px',
        flex: 0,
        position: 'absolute',
        offsetTop: '10px',
        cornerRadius: '5px',
        width: '55px',
        height: '25px',
        paddingStart: '4px',
        offsetEnd: '10px',
      });
    }

    if (e.theater.includes('sf')) {
      poster.push({
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'text',
            text: 'SF Cinema',
            size: 'xxs',
            color: '#ffffff',
            align: 'center',
            gravity: 'center',
          },
        ],
        backgroundColor: '#2f67cdcc',
        paddingAll: '2px',
        paddingEnd: '4px',
        flex: 0,
        position: 'absolute',
        offsetTop: '10px',
        cornerRadius: '5px',
        width: '70px',
        height: '25px',
        paddingStart: '4px',
        offsetEnd: `${(e.theater.includes('major') ? 60 : 0) + 10}px`,
      });
    }

    return {
      type: 'bubble',
      size: 'kilo',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: poster,
            paddingAll: '0px',
            cornerRadius: '0px',
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: e.display,
                color: '#ffffff',
                size: 'sm',
                weight: 'bold',
              },
              {
                type: 'text',
                text: `${dayjs(e.release)
                  .locale('th-TH')
                  .format('DD MMMM YYYY')
                  }`,
                color: '#ffffffcc',
                size: 'xxs',
              },
              {
                type: 'text',
                text: `${e.time} นาที`,
                color: '#ffffff',
                size: 'xxs',
                weight: 'regular',
                position: 'absolute',
                offsetTop: '29px',
                offsetEnd: '10px',
              },
            ],
            position: 'absolute',
            backgroundColor: '#464F69cc',
            offsetBottom: '0px',
            width: '100%',
            paddingStart: '20px',
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingEnd: '10px',
            action: {
              type: 'uri',
              label: 'action',
              uri: encodeURI(
                `https://www.youtube.com/results?search_query=${e.display.replace(/\W/gi, '+')}+trailer`,
              ),
            },
          },
        ],
        paddingAll: '0px',
        cornerRadius: '0px',
      },
    };
  });

  return {
    type: 'flex',
    altText: msg,
    contents: { type: 'carousel', contents: flex },
  };
};
