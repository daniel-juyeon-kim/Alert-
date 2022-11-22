const axios = require("axios");
exports.getCctvSrc = async (cctvUrl) => {
    let srcList = [];
    await axios({
        url: cctvUrl,
        method:'get',
      }).then(function(res) {
        let info = res.data.response.data; //cctvList
        if (info !== undefined) {
            for (let i=0; info.length>i; i++) {
                let cctvData = {
                    name : info[i].cctvname,
                    src : info[i].cctvurl,
                    coordx : info[i].coordx,
                    coordy : info[i].coordy
                }
                srcList.push(cctvData);
            }
        } else {
            console.log("cctv is nothing");
        }
      });
    return srcList;
};

exports.getCctvUrl = (apiKey, centerX, centerY) => { //중심좌표 근방 cctv url 리턴

  //중심 좌표를 기준으로 반경 500m 범위 내 cctv 목록 계산
//   const k = 0.0050445;
   const k = 0.0150445;
  const minX = centerX - k;
  const maxX = centerX + k;
  const minY = centerY - k;
  const maxY = centerY + k;
  const url = `https://openapi.its.go.kr:9443/cctvInfo?apiKey=${apiKey}&type=ex&cctvType=1&minX=${minX}&maxX=${maxX}&minY=${minY}&maxY=${maxY}&getType=json`;
  return url;
};

exports.cctvVideoScript = (src) => {
  return `
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <script>
    const video = document.getElementById('video');
    const videoSrc = '${src}';

    if (Hls.isSupported()) {
        const hls = new Hls();

        hls.loadSource(videoSrc);
        hls.attachMedia(video);                    
    } else if (video,canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoSrc;
        video.addEventListener('loadedmetadata', () => {
            video.play();
        });
    }
</script>`;
};