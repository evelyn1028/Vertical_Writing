// 전역 변수
let selectedElement = null;
let activeElement = null;
let offsetX = 0, offsetY = 0;
let controlPanel = null;

// 문서가 로드되면 이벤트 리스너 추가
document.addEventListener('DOMContentLoaded', function() {
    // 모든 요소에 이벤트 리스너 추가
    addEventListenersToElements();
    
    // 컨트롤 패널 참조 저장
    controlPanel = document.getElementById('style-control-panel');
    
    // jscolor 초기화 확인 (jscolor 버전 2.0.4 호환성 수정)
    if (typeof jscolor !== 'undefined') {
        // jscolor 클래스를 가진 입력 요소에 대해 수동으로 초기화
        const colorPicker = document.getElementById('color-picker-element');
        if (colorPicker) {
            // jscolor 클래스가 이미 초기화를 처리함
            new jscolor(colorPicker);
        }
    }
    
    // 커스텀 커서 초기화 - 마우스 포인터 위치를 추적하고 시각적 효과 제공
    try {
        // Follower 클래스의 새 인스턴스 생성
        // - delay: 0.2초 (팔로워 잔상 간의 시간 지연)
        // - count: 7개 (메인 커서 뒤에 따라오는 잔상 개수)
        new Follower({ delay: 0.2, count: 7 });
    } catch (error) {
        // 오류 발생 시 콘솔에 오류 메시지 출력 (디버깅용)
        console.error("커스텀 커서 초기화 오류:", error);
    }
    
    // + 버튼 이벤트 리스너
    document.getElementById('add-button').addEventListener('click', function() {
        if (selectedElement) {
            // 선택된 요소의 복사본 생성
            const clone = selectedElement.cloneNode(true);
            // 복사본에 고유 ID 부여
            clone.id = 'draggable-' + Date.now();
            // 복사본에 이벤트 리스너 추가
            addEventListenersToElement(clone);
            
            // 컨테이너에 추가
            document.querySelector('.container').appendChild(clone);
            
            // 위치 설정 (선택된 요소 근처)
            const rect = selectedElement.getBoundingClientRect();
            clone.style.position = 'absolute';
            clone.style.left = (rect.left + 20) + 'px';
            clone.style.top = (rect.top + 20) + 'px';
        } else {
            alert('요소를 먼저 선택해 주세요!');
        }
    });
    
    // 휴지통 드래그 앤 드롭 이벤트
    const trash = document.getElementById('trash');
    
    // 휴지통 클릭 이벤트 추가
    trash.addEventListener('click', function() {
        if (selectedElement) {
            // 선택된 요소 삭제
            selectedElement.remove();
            selectedElement = null;
        } else {
            alert('삭제할 요소를 먼저 선택해 주세요!');
        }
    });
    
    trash.addEventListener('dragover', function(e) {
        e.preventDefault(); // 기본 동작 방지
        this.style.opacity = '0.7'; // 드래그 중일 때 투명도 변경
    });
    
    trash.addEventListener('dragleave', function() {
        this.style.opacity = '1'; // 원래 투명도로 복원
    });
    
    trash.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.opacity = '1'; // 원래 투명도로 복원
        
        // 드래그된 요소 ID 가져오기
        const id = e.dataTransfer.getData('text');
        const draggedElement = document.getElementById(id);
        
        if (draggedElement) {
            draggedElement.remove(); // 요소 삭제
            selectedElement = null;
        }
    });
    
    // 컨테이너에 마우스 이벤트 추가
    const container = document.querySelector('.container');
    
    container.addEventListener('mousemove', function(e) {
        if (activeElement) {
            // 마우스 위치에서 오프셋을 빼서 요소 위치 계산
            const newLeft = e.clientX - offsetX;
            const newTop = e.clientY - offsetY;
            
            // 요소 위치 업데이트
            activeElement.style.left = newLeft + 'px';
            activeElement.style.top = newTop + 'px';
        }
    });
    
    container.addEventListener('mouseup', function() {
        if (activeElement) {
            activeElement.classList.remove('dragging');
            activeElement = null;
        }
    });
    
    // 마우스가 화면 밖으로 나갔을 때도 드래그 종료
    document.addEventListener('mouseleave', function() {
        if (activeElement) {
            activeElement.classList.remove('dragging');
            activeElement = null;
        }
    });
    
    // 사이즈 조절 슬라이더 이벤트 리스너
    document.getElementById('size-slider').addEventListener('input', function() {
        if (selectedElement) {
            updateElementSize(selectedElement, this.value);
            
            // 슬라이더 배경 업데이트
            const value = (this.value - this.min) / (this.max - this.min) * 100;
            this.style.setProperty('--value', `${value}%`);
        }
    });
    
    // 컨트롤 패널 초기화 (선택된 요소가 없으므로 비활성화)
    updateControlPanel(null);
    
    // selectedElement를 전역 객체에 노출 (색상 선택기가 접근할 수 있도록)
    window.selectedElement = selectedElement;
});

// 텍스트 색상 업데이트 함수 (글로벌 스코프에 필요)
function updateTextColor(picker) {
    // 선택된 요소가 있을 경우 색상 적용
    if (window.selectedElement) {
        const color = '#' + picker;
        
        // 요소 색상 업데이트
        updateElementColor(window.selectedElement, color);
    }
}

// 모든 요소에 이벤트 리스너 추가하는 함수
function addEventListenersToElements() {
    // 모든 드래그 가능한 요소 선택
    const draggableElements = document.querySelectorAll('.draggable');
    
    // 각 요소에 이벤트 리스너 추가 및 위치 설정
    draggableElements.forEach(function(element, index) {
        // 각 요소에 고유 ID 부여
        element.id = 'draggable-' + index;
        
        // 모든 draggable 요소의 위치를 absolute로 설정
        if (!element.style.position || element.style.position !== 'absolute') {
            element.style.position = 'absolute';
        }
        
        // 이벤트 리스너 추가
        addEventListenersToElement(element);
        
        // 더블 클릭 이벤트 - 텍스트 편집 (모든 draggable 요소에 추가)
        element.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            
            // 편집 모드 활성화
            this.contentEditable = true;
            this.classList.add('editable');
            this.focus();
        });
        
        // 편집 완료 시 이벤트
        element.addEventListener('blur', function() {
            this.contentEditable = false;
            this.classList.remove('editable');
        });
    });
    
    // 개별 글자들에 대해서 마우스 오버 이벤트 추가
    const textElements = document.querySelectorAll('.number, .blue-number, .alphabet');
    textElements.forEach(function(element) {
        // 마우스 오버 이벤트 - 배경 표시
        element.addEventListener('mouseover', function() {
            this.classList.add('hover-box');
        });
        
        // 마우스 아웃 이벤트 - 배경 제거
        element.addEventListener('mouseout', function() {
            this.classList.remove('hover-box');
        });
        
        // 더블 클릭 이벤트 - 텍스트 편집
        element.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            
            // 편집 모드 활성화
            this.contentEditable = true;
            this.classList.add('editable');
            this.focus();
        });
        
        // 편집 완료 시 이벤트
        element.addEventListener('blur', function() {
            this.contentEditable = false;
            this.classList.remove('editable');
        });
    });
}

// 개별 요소에 이벤트 리스너 추가하는 함수
function addEventListenersToElement(element) {
    // 클릭 이벤트 - 요소 선택
    element.addEventListener('click', function(e) {
        // 이전에 선택된 요소가 있으면 선택 해제
        if (selectedElement) {
            selectedElement.classList.remove('selected');
        }
        
        // 현재 요소 선택
        selectedElement = this;
        this.classList.add('selected');
        
        // 전역 객체에 selectedElement 업데이트 (색상 선택기가 접근할 수 있도록)
        window.selectedElement = selectedElement;
        
        // 컨트롤 패널 업데이트
        updateControlPanel(selectedElement);
        
        // 현재 색상을 색상 선택기에 표시
        updateColorPickerDisplay();
        
        e.stopPropagation(); // 이벤트 버블링 방지
    });
    
    // 마우스 관련 이벤트 추가
    element.addEventListener('mousedown', function(e) {
        // 다른 요소가 선택되어 있다면 해제
        if (selectedElement && selectedElement !== this) {
            selectedElement.classList.remove('selected');
        }
        
        // 현재 요소 선택 및 활성화
        selectedElement = this;
        window.selectedElement = selectedElement; // 전역 객체에 업데이트
        activeElement = this;
        this.classList.add('selected');
        this.classList.add('dragging');
        
        // 컨트롤 패널 업데이트
        updateControlPanel(selectedElement);
        
        // 현재 색상을 색상 선택기에 표시
        updateColorPickerDisplay();
        
        // 요소의 현재 실제 위치 가져오기
        const computedStyle = window.getComputedStyle(this);
        const currentLeft = parseFloat(computedStyle.left);
        const currentTop = parseFloat(computedStyle.top);
        
        // 마우스 포인터 위치와 요소 위치의 차이 계산
        offsetX = e.clientX - currentLeft;
        offsetY = e.clientY - currentTop;
        
        // 요소를 최상위로 올리기 위해 z-index 높게 설정
        this.style.zIndex = 1000;
        
        e.preventDefault();
    });
}

// 클릭하면 선택 해제되도록 문서 바디에 이벤트 리스너 추가
document.body.addEventListener('click', function(e) {
    if (e.target === document.body || e.target.classList.contains('container')) {
        if (selectedElement) {
            selectedElement.classList.remove('selected');
            selectedElement = null;
            window.selectedElement = null; // 전역 객체에서도 제거
            
            // 컨트롤 패널 비활성화
            updateControlPanel(null);
        }
    }
});

// 현재 선택된 요소의 색상을 색상 선택기에 표시
function updateColorPickerDisplay() {
    if (selectedElement) {
        const color = window.getComputedStyle(selectedElement).color;
        const hexColor = rgbToHex(color);
        
        // 색상 선택기 값 업데이트
        const colorPicker = document.getElementById('color-picker-element');
        if (colorPicker && typeof jscolor !== 'undefined') {
            if (colorPicker.jscolor) {
                colorPicker.jscolor.fromString(hexColor);
            } else {
                // jscolor 객체가 없는 경우 새로 생성
                const picker = new jscolor(colorPicker);
                picker.fromString(hexColor);
            }
        }
    }
}

// 컨트롤 패널 업데이트 함수
function updateControlPanel(element) {
    // 선택된 요소가 없으면 컨트롤 비활성화
    const sizeSlider = document.getElementById('size-slider');
    const colorPicker = document.getElementById('color-picker-element');
    
    if (!element) {
        sizeSlider.disabled = true;
        if (colorPicker) {
            colorPicker.disabled = true;
            colorPicker.style.opacity = '0.5';
        }
        return;
    }
    
    // 컨트롤 활성화
    sizeSlider.disabled = false;
    if (colorPicker) {
        colorPicker.disabled = false;
        colorPicker.style.opacity = '1';
    }
    
    // 현재 선택된 요소의 스타일에 맞게 슬라이더 값 설정
    const fontSize = parseInt(window.getComputedStyle(element).fontSize);
    const color = window.getComputedStyle(element).color;
    
    // RGB 색상을 HEX로 변환
    const hexColor = rgbToHex(color);
    
    // 슬라이더 및 컬러 피커 초기값 설정
    sizeSlider.value = Math.min(100, Math.max(10, fontSize));
    
    // 슬라이더 배경 업데이트
    const value = (sizeSlider.value - sizeSlider.min) / (sizeSlider.max - sizeSlider.min) * 100;
    sizeSlider.style.setProperty('--value', `${value}%`);
    
    // 색상 선택기 업데이트
    if (colorPicker && typeof jscolor !== 'undefined') {
        if (colorPicker.jscolor) {
            colorPicker.jscolor.fromString(hexColor);
        } else {
            // jscolor 객체가 없는 경우 새로 생성
            const picker = new jscolor(colorPicker);
            picker.fromString(hexColor);
        }
    }
}

// 요소 크기 업데이트 함수
function updateElementSize(element, size) {
    // 개별 span 요소인 경우 (숫자, 알파벳 등)
    if (element.classList.contains('number') || 
        element.classList.contains('blue-number') || 
        element.classList.contains('alphabet')) {
        element.style.fontSize = size + 'px';
    } 
    // 컨테이너 요소인 경우 (여러 span을 포함하는 vertical-writing 요소 등)
    else if (element.classList.contains('vertical-writing')) {
        // 내부의 모든 span에 적용
        const spans = element.querySelectorAll('span');
        spans.forEach(span => {
            span.style.fontSize = size + 'px';
        });
    }
    // vertical-text 클래스를 가진 요소의 경우
    else {
        element.style.fontSize = size + 'px';
    }
}

// 요소 색상 업데이트 함수
function updateElementColor(element, color) {
    // 개별 span 요소인 경우 (숫자, 알파벳 등)
    if (element.classList.contains('number') || 
        element.classList.contains('blue-number') || 
        element.classList.contains('alphabet')) {
        element.style.color = color;
    } 
    // 컨테이너 요소인 경우 (여러 span을 포함하는 vertical-writing 요소 등)
    else if (element.classList.contains('vertical-writing')) {
        // 내부의 모든 span에 적용
        const spans = element.querySelectorAll('span');
        spans.forEach(span => {
            span.style.color = color;
        });
    }
    // vertical-text 클래스를 가진 요소의 경우
    else {
        element.style.color = color;
    }
}

// RGB 색상을 HEX로 변환하는 함수
function rgbToHex(rgb) {
    // RGB 값이 없으면 기본 검정색 반환
    if (!rgb || rgb === 'none') return '#000000';
    
    // "rgb(r, g, b)" 형식에서 r, g, b 값 추출
    const match = rgb.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (!match) return '#000000';
    
    // 10진수를 16진수로 변환
    function toHex(x) {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }
    
    return '#' + toHex(match[1]) + toHex(match[2]) + toHex(match[3]);
}

// 커스텀 마우스 포인터 클래스
// Follower: 메인 커서와 여러 개의 팔로워(잔상)를 생성하여 마우스 움직임에 따라 애니메이션 효과를 만드는 클래스
class Follower {
    // 생성자: 지연 시간과 팔로워 개수를 매개변수로 받음
    // - delay: 각 팔로워 사이의 시간 지연(초 단위)
    // - count: 생성할 팔로워 개수
    constructor({ delay = 0.2, count = 5 }) {
        this.count = count;        // 팔로워 개수 저장
        this.delay = delay / 10;   // 지연 시간 저장 (0.1로 나누어 적절한 지연 값 계산)
        this.init();               // 초기화 함수 호출
    }
  
    // 초기화 함수: 모든 요소를 생성하고 이벤트 리스너 등록
    init() {
        this.followers = [];       // 팔로워 요소들을 저장할 배열
        this._creatCursor();       // 메인 커서 생성
        this._creatFollowers();    // 팔로워 커서들 생성
        this._setSize();           // 커서와 팔로워들의 크기 설정
        this._setInitialPos();     // 초기 위치 설정
        this._addEventListeners(); // 이벤트 리스너 등록
    }
  
    // DOM 요소 생성 함수: 커서와 팔로워를 위한 div 요소 생성
    // - className: 생성할 요소의 클래스명 ("cursor" 또는 "follower")
    _creatElem(className) {
        const elem = document.createElement("div");  // div 요소 생성
        elem.className = className;                  // 클래스명 설정
        elem.style.position = "fixed";               // position: fixed로 설정하여 화면 위치에 고정
        elem.style.pointerEvents = "none";           // 마우스 이벤트를 통과시켜 하단 요소와 상호작용 가능하게 함
        elem.style.zIndex = "9999";                  // 최상위 레이어에 표시
        elem.style.transform = "translate(-50%, -50%)"; // 중앙 정렬
        elem.style.borderRadius = "50%";             // 원형으로 설정
        elem.style.borderWidth = "4px";
        
        // 커서와 팔로워의 스타일 차별화
        if (className === "cursor") {
            elem.style.backgroundColor = "transparent";  // 배경색 투명
            elem.style.border = "1px solid var(--cursor-border)";  // 흰색 테두리
            elem.style.width = "var(--cursor-size)";    // 커서 너비
            elem.style.height = "var(--cursor-size)";   // 커서 높이
            
            // 중앙 점 생성 (가상 요소 대신 실제 요소로 생성)
            const dot = document.createElement("div");
            dot.style.position = "absolute";
            dot.style.top = "50%";
            dot.style.left = "50%";
            dot.style.transform = "translate(-50%, -50%)";
            dot.style.width = "var(--cursor-dot-size)";
            dot.style.height = "var(--cursor-dot-size)";
            dot.style.backgroundColor = "var(--cursor-dot-color)";
            dot.style.borderRadius = "50%";
            elem.appendChild(dot);
        } else {
            elem.style.backgroundColor = "transparent";  // 배경색 투명
            elem.style.border = "1px solid var(--follower-color)"; // 반투명 테두리
        }
        
        document.body.appendChild(elem);  // body에 요소 추가
        return elem;                      // 생성된 요소 반환
    }
    
    // 메인 커서 생성 함수
    _creatCursor() {
        this.cursor = this._creatElem("cursor");  // cursor 클래스를 가진 요소 생성
    }
    
    // 팔로워 커서들 생성 함수
    _creatFollowers() {
        for (let i = 0; i < this.count; i++) {
            const f = this._creatElem("follower");  // follower 클래스를 가진 요소 생성
            this.followers.push(f);                 // 팔로워 배열에 추가
        }
    }
    
    // 커서와 팔로워의 크기 설정 함수
    // 각 팔로워는 이전 요소보다 75% 크기로 점점 작아짐
    _setSize() {
        let prev;  // 이전 요소 참조 저장 변수
  
        this.followers.forEach(follower => {
            if (!prev) {
                prev = this.cursor;  // 첫 번째 팔로워는 메인 커서와 비교
            }
  
            // 직접 크기 설정 - 이전 요소의 75% 크기로 설정
            const width = parseFloat(getComputedStyle(prev).width) * 0.75;
            const height = parseFloat(getComputedStyle(prev).height) * 0.75;
            
            // 스타일 적용
            follower.style.width = width + "px";
            follower.style.height = height + "px";
            
            prev = follower;  // 현재 요소를 이전 요소로 저장 (다음 반복에서 사용)
        });
    }
    
    // 커서와 팔로워의 초기 위치 설정 함수
    // 처음에는 화면 중앙에 배치
    _setInitialPos() {
        this.x = innerWidth / 2;   // 화면 가로 중앙
        this.y = innerHeight / 2;  // 화면 세로 중앙
        
        // 메인 커서 위치 설정
        this.cursor.style.left = this.x + "px";
        this.cursor.style.top = this.y + "px";
        
        // 모든 팔로워에 동일한 초기 위치 설정
        this.followers.forEach(follower => {
            follower.style.left = this.x + "px";
            follower.style.top = this.y + "px";
        });
    }
    
    // 이벤트 리스너 등록 함수
    _addEventListeners() {
        // 마우스 이동 이벤트
        document.addEventListener("mousemove", event => {
            const e = event.touches ? event.touches[0] : event;  // 터치 이벤트도 지원
            this.x = e.clientX;  // 현재 마우스 X 좌표
            this.y = e.clientY;  // 현재 마우스 Y 좌표
  
            // 메인 커서는 즉시 마우스 위치로 이동
            this.cursor.style.left = this.x + "px";
            this.cursor.style.top = this.y + "px";
            
            // 팔로워들은 시간차를 두고 순차적으로 이동
            // 이를 통해 부드러운 잔상 효과 생성
            this.followers.forEach((follower, index) => {
                setTimeout(() => {
                    follower.style.left = this.x + "px";
                    follower.style.top = this.y + "px";
                }, index * this.delay * 1000);  // 인덱스에 따라 지연 시간 증가
            });
        });
        
        // 드래그 가능한 요소에 마우스 호버 시 커서 효과 변경
        const draggables = document.querySelectorAll(".draggable");
        draggables.forEach(el => {
            // 마우스가 요소 위로 진입할 때 커서 확대
            el.addEventListener("mouseenter", () => {
                // 원형 커서 1.2배 확대
                this.cursor.style.transform = "translate(-50%, -50%) scale(1.2)";
                this.cursor.style.borderColor = "#ffffff"; // 테두리 색상 흰색으로
                this.cursor.style.borderWidth = "5px"; // 테두리 굵기 강조
                
                // 중앙 점 강조
                if (this.cursor.firstChild) {
                    this.cursor.firstChild.style.backgroundColor = "#ffffff";
                }
                
                // 팔로워들도 확대
                this.followers.forEach((follower, index) => {
                    const scale = 1.2 - (index * 0.05);
                    follower.style.transform = `translate(-50%, -50%) scale(${scale})`;
                });
            });
            
            // 마우스가 요소에서 나갈 때 커서 원래 크기로 복원
            el.addEventListener("mouseleave", () => {
                this.cursor.style.transform = "translate(-50%, -50%) scale(1)";
                this.cursor.style.borderColor = "var(--cursor-border)";
                this.cursor.style.borderWidth = "4px";
                
                // 중앙 점 원래대로
                if (this.cursor.firstChild) {
                    this.cursor.firstChild.style.backgroundColor = "var(--cursor-dot-color)";
                }
                
                this.followers.forEach(follower => {
                    follower.style.transform = "translate(-50%, -50%) scale(1)";
                });
            });
        });
        
        // 마우스 클릭 효과 - 클릭 시 커서 크기 축소
        document.addEventListener("mousedown", () => {
            // 클릭 시 커서 약간 축소 및 색상 변경
            this.cursor.style.transform = "translate(-50%, -50%) scale(0.9)";
            this.cursor.style.borderColor = "#ffffff";
            
            // 중앙 점 강조
            if (this.cursor.firstChild) {
                this.cursor.firstChild.style.backgroundColor = "#ffffff";
                this.cursor.firstChild.style.transform = "translate(-50%, -50%) scale(1.2)";
            }
            
            // 팔로워들도 축소
            this.followers.forEach(follower => {
                follower.style.transform = "translate(-50%, -50%) scale(0.9)";
                follower.style.opacity = "0.5"; // 약간 투명하게
            });
        });
        
        // 마우스 클릭 해제 시 커서 원래 크기로 복원
        document.addEventListener("mouseup", () => {
            this.cursor.style.transform = "translate(-50%, -50%) scale(1)";
            this.cursor.style.borderColor = "var(--cursor-border)";
            
            // 중앙 점 원래대로
            if (this.cursor.firstChild) {
                this.cursor.firstChild.style.backgroundColor = "var(--cursor-dot-color)";
                this.cursor.firstChild.style.transform = "translate(-50%, -50%)";
            }
            
            // 팔로워들 원래대로
            this.followers.forEach(follower => {
                follower.style.transform = "translate(-50%, -50%) scale(1)";
                follower.style.opacity = "1";
            });
        });
    }
}