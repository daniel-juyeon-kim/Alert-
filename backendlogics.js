const access = require("./DB/access");
const validation = require("./validation");

module.exports = {
  /**
   * DB의 알람 데이터를 분석하여 해당 알람을 문자열로 리턴하는 로직
   * @param {*} request 
   * @param {*} response 
   * @returns 로그인된 유저의 알람 정보를 리턴
   */
  getAlarmData : (request, response) => {
    let userid = request.session.userid;
    let alarms = "";

    let rowCount = access.query(request, response, `SELECT count(*) as count FROM Alert.alarm where user_id = '${userid}';`)[0].count;
    let alarmTable = access.query(request, response, `SELECT * FROM Alert.alarm where user_id = '${userid}';`);

    for (let row = 0; row < rowCount; row++) {
      let dayOfWeek = alarmTable[row].day_of_week;
      let alarmDay = "";
      for (let col = 0; col < dayOfWeek.length; col++) {
        let dayOfWeekPart = dayOfWeek.substring(col, col + 1);
        switch (dayOfWeekPart) {
          case "0":
            alarmDay += "일";
            break;
          case "1":
            alarmDay += "월";
            break;
          case "2":
            alarmDay += "화";
            break;
          case "3":
            alarmDay += "수";
            break;
          case "4":
            alarmDay += "목";
            break;
          case "5":
            alarmDay += "금";
            break;
          case "6":
            alarmDay += "토";
            break;
        }
      }
      alarms += `<div>`;
      alarms += alarmDay + " ";
      alarms += alarmTable[row].departure_time + " ";
      alarms += alarmTable[row].alarm_time + " ";
      alarms += alarmTable[row].departrue_adress + " ";
      alarms += alarmTable[row].arrive_adress;
      alarms += `</div><br>`;
    }
    return alarms;
  },

  /**
   * Form으로 받은 데이터를 가공하는 후 알람이 겹치는지 확인, 테이블에 행을 추가하는 로직
   * @param {*} request 
   * @param {*} response 
   * @param {*} formData : Form으로 받은 객체타입의 데이터
   */
  createAlarm : (request, response, formData) => {
    let dayOfWeek = "";
    let dayList = formData.Day_of_the_week

    for (let i = 0; i < dayList.length;i++) {
      if (i === 0 )
        dayOfWeek += dayList[i]
      else 
        dayOfWeek += dayList[i]
    }
    
    let departureTime = parseInt(formData.depart_time_hour) + ":" + parseInt(formData.depart_time_min);
    let alarmTime = parseInt(formData.alarm_time_hour) + ":" + parseInt(formData.alarm_time_min);
    let departrueAdress = formData.출발지
    let arriveAdress = formData.도착지
    
    // 중복 확인 작업 
    
    let alarmTable = access.query(request, response, `select * from Alert.alarm where user_id = '${request.session.userid}';`);
    
    if (alarmTable.length === 0) {
      access.insertAlarmData(request, response, dayOfWeek, departureTime, alarmTime, departrueAdress, arriveAdress);
      response.redirect('/alarm');
    }
    else {
      for (let row = 0; row < alarmTable.length;row++) {
        let alarmTableData = alarmTable[row]
        if (alarmTableData.user_id === request.session.userid && alarmTableData.day_of_week === dayOfWeek && 
          alarmTableData.departure_time === departureTime && alarmTableData.alarm_time === alarmTime &&
          alarmTableData.departrue_adress === departrueAdress && alarmTableData.arrive_adress === arriveAdress)  {
            console.log("중복");
            response.redirect('back');
            break;
          } else if (row === alarmTable.length - 1) {
            access.insertAlarmData(request, response, dayOfWeek, departureTime, alarmTime, departrueAdress, arriveAdress);
            response.redirect('/alarm');
            break;
          }
        }
      }
  },

  /**
   * 현재시간과 비교하여 가장 가까운 알람의 데이터를 반환하는 로직
   * @param {*} request 
   * @param {*} response 
   * @returns 현재시간과 비교하여 가장 가까운 알람의 시간을 문자열로 반환한다.
   */
  getNearTime : (request, response) => {
    let browserDate = new Date().getDay();
    // DB에서 테이블 가지고온 후 요일 문자열 비교 => 출발 시간 비교
    let alarmTable = access.query(request, response, `select * from Alert.alarm where user_id = '${request.session.userid}';`)
    let rowCount = alarmTable.length

    let alarmList = []

    // 요일 비교 - 현재 요일보다 이후 요일에 알람이 있는 경우
    for (let row = 0; row < rowCount ;row++) {
      for (let col = 0; col < alarmTable[row].day_of_week.length ;col++) {
        if (browserDate < parseInt(alarmTable[row].day_of_week.substring(col,col+1))) {
          alarmList.push(alarmTable[row])
          break;
        }
        // 금일과 같은 요일인 경우 시간과 분까지 비교해주는 로직
        else if (browserDate === parseInt(alarmTable[row].day_of_week.substring(col,col+1)) && 
          !(validation.isOverTime(alarmTable[row]))) {
          // console.log(alarmTable[row])
          alarmList.push(alarmTable[row])
          break;
        }
      }
    }
    
    // 요일 비교 - 현재 요일보다 이후 요일이 없는 경우 (현재 요일 : 금요일, 알람 요일 : 월요일)
    if (alarmList.length === 0) {
      console.log("underalarmlist")
      let min = 6;
      for (let row = 0; row < rowCount; row++) {
        if (min >= parseInt(alarmTable[row].day_of_week.substring(0, 1))) {
          min = parseInt(alarmTable[row].day_of_week.substring(0, 1));
        }
      }
      for (let row = 0; row < rowCount; row++) {
        if (min === parseInt(alarmTable[row].day_of_week.substring(0, 1))) {
          alarmList.push(alarmTable[row]);
        }
      }
    }
    // 요일 비교 - 알람이없는 경우
    if (alarmList.length === 0) {
      console.log("등록된 알람이 없음")
      return "등록된 알람이 없음";
    }

    let alarmTimeList = [];
    let alarmTimeid = [];

    // console.log(alarmList)
    // 필터링
    for (let row = 0; row < alarmList.length ;row++) {
      for (let col = 0; col < alarmList[row].departure_time.length ;col++) {
        if (alarmList[row].departure_time.substring(col,col+1) === ":") {
          let hour = parseInt(alarmList[row].departure_time.substring(0,col)); 
          let min = parseInt(alarmList[row].departure_time.substring(col+1,parseInt(alarmList[row].departure_time.length + 1)))
          alarmTimeList.push(hour*100 + min)
          alarmTimeid.push(alarmList[row].alarm_id)
          break;
        }
      }
    }
    
    let departTime = Math.min.apply(null, alarmTimeList);
    let minIndex;
    for (let index = 0; index <alarmTimeList.length ;index++) {
      if (departTime === alarmTimeList[index]) {
        minIndex = index;
      }
    }
    let minAlarm = alarmTimeid[minIndex];
    return access.query(request, response, `select * from Alert.alarm where user_id = '${request.session.userid}' and alarm_id = '${minAlarm}';`)[0];
  },
};
  