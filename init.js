import { fuelTruckPath, dinnerCarPath, airCarPath, executiveCarPath, ambulancePath } from "./data.js"
//汽车类
class Car {
    constructor(name, lng, lat, historyPath) {
        this.point = new BMapGL.Point(lng, lat);
        this.label = new BMapGL.Label(name, {
            position: this.point,
            offset: new BMapGL.Size(0, 0)
        })
        let path = arguments[3] ? historyPath : []
        const pointArr = [];
        for (let i = 0; i < path.length; i++) {
            pointArr.push(new BMapGL.Point(path[i].lng, path[i].lat));
        }
        // 将轨迹添加到覆盖物类上，方便遍历调用
        let pl = new BMapGL.Polyline(pointArr)
        // 计算轨迹的长度，得出车辆行驶的距离
        let distance = 0
        for (let i = 0; i < pointArr.length - 1; i++) {
            distance += map.getDistance(pointArr[i], pointArr[i + 1])
        }

        this.label.distance = +(distance / 1000).toFixed(4)
        this.label.trackAni = new BMapGLLib.TrackAnimation(map, pl, {
            overallView: true, // 动画完成后自动调整视野到总览
            tilt: 20,          // 轨迹播放的角度，默认为55
            duration: 5000,   // 动画持续时长，默认为10000，单位ms
            zoom: 18,
            delay: 100        // 动画开始的延迟，默认0，单位ms
        });
    }

    setStyle(style) {
        this.label.setStyle(style)
    }
}


// 初始化所有的车辆位置
const fuelTruck = new Car("加油车", 121.815191, 31.141428, fuelTruckPath)
fuelTruck.setStyle({
    color: '#000',
    fontSize: '16px',
    background: "grey",
    border: "1px solid black",
})
map.addOverlay(fuelTruck.label)

const dinnerCar = new Car("餐饮车", 121.813485, 31.139689, dinnerCarPath)
dinnerCar.setStyle({
    color: '#000',
    fontSize: '16px',
    background: "yellow",
    border: "1px solid black"
})
map.addOverlay(dinnerCar.label)

const airCar = new Car("空调车", 121.814042, 31.147431, airCarPath)
airCar.setStyle({
    color: '#000',
    fontSize: '16px',
    background: "#4ef4d5",
    border: "1px solid black"
})
map.addOverlay(airCar.label)

const executiveCar = new Car("行政车", 121.811508, 31.147585, executiveCarPath)
executiveCar.setStyle({
    color: '#000',
    fontSize: '16px',
    background: "green",
    border: "1px solid black"
})
map.addOverlay(executiveCar.label)

const ambulance = new Car("急救车", 121.821282, 31.144278, ambulancePath)
ambulance.setStyle({
    color: '#000',
    fontSize: '16px',
    background: "red",
    border: "1px solid black"
})
map.addOverlay(ambulance.label)


//生成汽车列表
const overlaysArray = map.getOverlays()
//这里的所有car都是label
overlaysArray.map(car => {
    const carList = document.getElementById("carList")
    const carli = document.createElement("li")
    carli.innerHTML = car.content + ":"
    const btn1 = document.createElement("button")
    btn1.innerHTML = "定位"
    btn1.className = "Btn"
    const btn2 = document.createElement("button")
    btn2.innerHTML = "轨迹"
    btn2.className = "Btn"
    const btn3 = document.createElement("button")
    btn3.innerHTML = "派单"
    btn3.className = "Btn"

    btn1.addEventListener("click", () => {
        // alert(`定位${car.content}，位置：（${car.latLng.lng}，${car.latLng.lat}）`)
        map.flyTo(car.latLng, 18)
    })
    btn2.addEventListener("click", () => {
        if (btn2.innerHTML === "轨迹") {
            setTimeout(() => {
                car.trackAni.getPolyline().show()
            }, 200)
            car.trackAni.start()
            setTimeout(() => { btn2.innerHTML = "清除" }, 200)
        }
        else if (btn2.innerHTML === "清除") {
            car.trackAni.cancel()
            car.trackAni.getPolyline().hide()
            setTimeout(() => { btn2.innerHTML = "轨迹" }, 200)
        }
    })

    btn3.addEventListener("click", () => {
        alert("请在地图上选择目的地")
        map.addEventListener("click", function handle(e) {
            const point = new BMapGL.Point(e.latlng.lng, e.latlng.lat)
            const marker = new BMapGL.Marker(point)
            map.addOverlay(marker)
            map.removeEventListener("click", handle)
            const pl = car.trackAni.getPolyline().getPath()
            pl.push(point)
            car.trackAni.getPolyline().setPath(pl)
            setTimeout(() => {
                map.removeOverlay(marker)
            }, 2000)
            // 自动导航
            // const driving = new BMapGL.DrivingRoute(map, { renderOptions: { map: map, autoViewport: true } });
            // driving.search(pl[pl.length - 2], point);
            car.distance += +(map.getDistance(pl[pl.length - 2], point) / 1000).toFixed(4)
            // 派单后刷新图表数据
            getChart()
        })
    })

    carli.append(btn1, btn2, btn3)
    carList.appendChild(carli)
})

//为地图上的汽车标签添加点击事件
overlaysArray.map(car => {
    car.addEventListener("mouseover", () => {
        const opts = {
            width: 250,     // 信息窗口宽度
            height: 100,    // 信息窗口高度
            title: car.content + "的信息"  // 信息窗口标题
        }
        const infoWindow = new BMapGL.InfoWindow("World", opts)
        infoWindow.setContent(`经纬：（${car.latLng.lat}，${car.latLng.lng}）
                               行驶路程：${car.distance}km`)
        map.openInfoWindow(infoWindow, car.latLng)
    })
})



//生成图表
function getChart() {
    const contentArr = overlaysArray.map(car => {
        return car.content
    })
    const distanceArr = overlaysArray.map(car => {
        return car.distance
    })
    const chart = new echarts.init(document.getElementById('chart'))
    const opt = {
        title: {
            text: '历史路程'
        },
        tooltip: {},
        legend: {
            data: ['路程（km）']
        },
        xAxis: {
            data: contentArr
        },
        yAxis: {},
        series: [
            {
                name: '路程',
                type: 'bar',
                data: distanceArr
            }
        ]
    }
    chart.setOption(opt);
}

getChart()

const swiftBtn = document.getElementById('swiftBtn')
function getStyle(dom, attr) {
    if (dom.currentStyle) {
        return dom.currentStyle[attr]
    } else {
        return getComputedStyle(dom)[attr]
    }
}
swiftBtn.addEventListener("click", () => {
    let chart = document.getElementById('chart')
    if (getStyle(chart, 'display') == 'block') {
        chart.style.display = "none";
    } else {
        chart.style.display = 'block';
    }
    swiftBtn.innerHTML = chart.style.display === 'block' ? '隐藏图表' : '展示图表'
})