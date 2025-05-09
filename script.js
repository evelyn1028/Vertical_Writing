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
    
    // CSS 커서를 위한 마우스 이동 추적
    document.addEventListener('mousemove', function(e) {
        // 마우스 위치 업데이트
        document.body.style.setProperty('--cursor-left', e.clientX + 'px');
        document.body.style.setProperty('--cursor-top', e.clientY + 'px');
    });

    // 드래그 가능한 요소에 호버 효과 추가
    const interactiveElements = document.querySelectorAll('.draggable, .control-button, .trash-can');
    interactiveElements.forEach(element => {
        // 마우스 진입 시 커서 확대
        element.addEventListener('mouseenter', () => {
            document.body.classList.add('hover-cursor');
        });
        
        // 마우스 나갈 때 커서 원래대로
        element.addEventListener('mouseleave', () => {
            document.body.classList.remove('hover-cursor');
        });
    });

    // 마우스 클릭 시 효과
    document.addEventListener('mousedown', () => {
        document.body.classList.add('click-cursor');
    });

    document.addEventListener('mouseup', () => {
        document.body.classList.remove('click-cursor');
    });
    
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
            
            // 복제된 요소가 vertical-writing 클래스를 가지고 있다면 너비 조정
            if (clone.classList.contains('vertical-writing')) {
                adjustContainerWidth(clone);
            }
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
    
    // 초기 로드 시 모든 vertical-writing 컨테이너의 너비를 내부 요소에 맞게 조정
    const verticalWritingContainers = document.querySelectorAll('.vertical-writing');
    verticalWritingContainers.forEach(container => {
        adjustContainerWidth(container);
    });
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
            
            // 편집 시작 시 컨테이너 너비 초기화
            if (this.classList.contains('vertical-writing')) {
                // 데이터 속성이 없으면 현재 너비를 저장
                if (!this.dataset.originalWidth) {
                    this.dataset.originalWidth = window.getComputedStyle(this).width;
                }
                
                // 각 자식 요소에 편집 모드 스타일 적용
                const spans = this.querySelectorAll('span');
                spans.forEach(span => {
                    span.style.maxWidth = '100%';
                    span.style.wordBreak = 'break-all';
                    span.style.overflowWrap = 'break-word';
                    span.style.whiteSpace = 'normal';
                });
            } else if (this.parentElement && this.parentElement.classList.contains('vertical-writing')) {
                // 부모가 vertical-writing인 경우, 현재 요소에 편집 모드 스타일 적용
                const containerWidth = parseInt(window.getComputedStyle(this.parentElement).width);
                this.style.maxWidth = (containerWidth - 10) + 'px';
                this.style.wordBreak = 'break-all';
                this.style.overflowWrap = 'break-word';
                this.style.whiteSpace = 'normal';
            }
            
            this.focus();
        });
        
        // 편집 완료 시 이벤트
        element.addEventListener('blur', function() {
            this.contentEditable = false;
            this.classList.remove('editable');
            
            // 편집 후 텍스트 스타일 조정
            // 여러 글자인 경우 자동 줄바꿈 적용
            if (this.textContent && this.textContent.length > 1) {
                this.style.wordBreak = 'break-all';
                this.style.overflowWrap = 'break-word';
                this.style.whiteSpace = 'normal';
            }
            
            // 부모가 vertical-writing 컨테이너인 경우 부모 너비 조정
            if (this.parentElement && this.parentElement.classList.contains('vertical-writing')) {
                adjustContainerWidth(this.parentElement);
            }
        });
    });
    
    // 개별 글자들에 대해서 마우스 오버 이벤트 추가
    const textElements = document.querySelectorAll('.number, .blue-number, .alphabet');
    textElements.forEach(function(element) {
        // 마우스 오버 이벤트 - 배경 표시
        element.addEventListener('mouseover', function() {
            // 원래 너비 저장
            if (!this.dataset.originalWidth) {
                this.dataset.originalWidth = window.getComputedStyle(this).width;
            }
            
            // 마우스 호버 시에도 텍스트 줄바꿈 유지
            if (this.textContent.length > 1) {
                this.style.wordBreak = 'break-all';
                this.style.overflowWrap = 'break-word';
                this.style.whiteSpace = 'normal';
            }
            
            // hover-box 클래스 추가
            this.classList.add('hover-box');
        });
        
        // 마우스 아웃 이벤트 - 배경 제거
        element.addEventListener('mouseout', function() {
            this.classList.remove('hover-box');
            
            // 텍스트 스타일 유지
            if (this.textContent.length > 1) {
                this.style.wordBreak = 'break-all';
                this.style.overflowWrap = 'break-word';
                this.style.whiteSpace = 'normal';
            }
            
            // 만약 편집 모드가 아니라면 컨테이너 너비 조정
            if (this.contentEditable !== 'true' && this.parentElement && 
                this.parentElement.classList.contains('vertical-writing')) {
                adjustContainerWidth(this.parentElement);
            }
        });
        
        // 더블 클릭 이벤트 - 텍스트 편집
        element.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            
            // 편집 모드 활성화
            this.contentEditable = true;
            this.classList.add('editable');
            
            // 편집을 위한 스타일 설정
            if (this.parentElement && this.parentElement.classList.contains('vertical-writing')) {
                const container = this.parentElement;
                const containerWidth = parseInt(window.getComputedStyle(container).width);
                
                // 편집 모드에서는 텍스트 줄바꿈을 보장
                this.style.maxWidth = (containerWidth - 10) + 'px';
                this.style.wordBreak = 'break-all';
                this.style.overflowWrap = 'break-word';
                this.style.whiteSpace = 'normal';
                
                // hover 효과 제거
                this.classList.remove('hover-box');
            }
            
            this.focus();
        });
        
        // 입력 이벤트 리스너 추가 - 텍스트가 변경될 때마다 호출
        element.addEventListener('input', function() {
            // 직접 편집 중인 경우
            if (this.contentEditable === 'true') {
                // 컨테이너 요소인 경우
                if (this.classList.contains('vertical-writing')) {
                    // 각 span 요소에 대해 최대 너비 설정
                    const spans = this.querySelectorAll('span');
                    const containerWidth = parseInt(window.getComputedStyle(this).width);
                    
                    spans.forEach(span => {
                        // 명시적으로 편집 모드 스타일 적용
                        span.style.maxWidth = (containerWidth - 10) + 'px';
                        span.style.wordBreak = 'break-all';
                        span.style.overflowWrap = 'break-word';
                        span.style.whiteSpace = 'normal';
                        span.style.display = 'block'; // 블록 레벨로 설정하여 줄바꿈 보장
                    });
                } 
                // 개별 요소인 경우
                else {
                    // 부모가 vertical-writing 컨테이너인 경우
                    if (this.parentElement && this.parentElement.classList.contains('vertical-writing')) {
                        const container = this.parentElement;
                        const containerWidth = parseInt(window.getComputedStyle(container).width);
                        
                        // 편집 모드에서는 텍스트 줄바꿈을 보장
                        this.style.maxWidth = (containerWidth - 10) + 'px';
                        this.style.wordBreak = 'break-all';
                        this.style.overflowWrap = 'break-word';
                        this.style.whiteSpace = 'normal';
                        this.style.display = 'block'; // 블록 레벨로 설정하여 줄바꿈 보장
                    }
                }
            }
            
            // vertical-writing 컨테이너인 경우 너비 조정
            if (this.classList.contains('vertical-writing')) {
                adjustContainerWidth(this);
            }
            // 부모가 vertical-writing 컨테이너인 경우 부모 너비 조정
            else if (this.parentElement && this.parentElement.classList.contains('vertical-writing')) {
                adjustContainerWidth(this.parentElement);
            }
        });
        
        // 편집 완료 시 이벤트
        element.addEventListener('blur', function() {
            this.contentEditable = false;
            this.classList.remove('editable');
            
            // 편집 후 텍스트 스타일 조정
            // 여러 글자인 경우 자동 줄바꿈 적용
            if (this.textContent && this.textContent.length > 1) {
                this.style.wordBreak = 'break-all';
                this.style.overflowWrap = 'break-word';
                this.style.whiteSpace = 'normal';
            }
            
            // 부모가 vertical-writing 컨테이너인 경우 부모 너비 조정
            if (this.parentElement && this.parentElement.classList.contains('vertical-writing')) {
                adjustContainerWidth(this.parentElement);
            }
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
    
    // 입력 이벤트 리스너 추가 - 텍스트가 변경될 때마다 호출
    element.addEventListener('input', function() {
        // 직접 편집 중인 경우
        if (this.contentEditable === 'true') {
            // 컨테이너 요소인 경우
            if (this.classList.contains('vertical-writing')) {
                // 각 span 요소에 대해 최대 너비 설정
                const spans = this.querySelectorAll('span');
                const containerWidth = parseInt(window.getComputedStyle(this).width);
                
                spans.forEach(span => {
                    // 명시적으로 편집 모드 스타일 적용
                    span.style.maxWidth = (containerWidth - 10) + 'px';
                    span.style.wordBreak = 'break-all';
                    span.style.overflowWrap = 'break-word';
                    span.style.whiteSpace = 'normal';
                    span.style.display = 'block'; // 블록 레벨로 설정하여 줄바꿈 보장
                });
            } 
            // 개별 요소인 경우
            else {
                // 부모가 vertical-writing 컨테이너인 경우
                if (this.parentElement && this.parentElement.classList.contains('vertical-writing')) {
                    const container = this.parentElement;
                    const containerWidth = parseInt(window.getComputedStyle(container).width);
                    
                    // 편집 모드에서는 텍스트 줄바꿈을 보장
                    this.style.maxWidth = (containerWidth - 10) + 'px';
                    this.style.wordBreak = 'break-all';
                    this.style.overflowWrap = 'break-word';
                    this.style.whiteSpace = 'normal';
                    this.style.display = 'block'; // 블록 레벨로 설정하여 줄바꿈 보장
                }
            }
        }
        
        // vertical-writing 컨테이너인 경우 너비 조정
        if (this.classList.contains('vertical-writing')) {
            adjustContainerWidth(this);
        }
        // 부모가 vertical-writing 컨테이너인 경우 부모 너비 조정
        else if (this.parentElement && this.parentElement.classList.contains('vertical-writing')) {
            adjustContainerWidth(this.parentElement);
        }
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
        let color;
        
        // 묶음 텍스트(vertical-writing)인 경우 첫 번째 자식 요소의 색상 가져오기
        if (selectedElement.classList.contains('vertical-writing') && selectedElement.firstElementChild) {
            color = window.getComputedStyle(selectedElement.firstElementChild).color;
        } else {
            color = window.getComputedStyle(selectedElement).color;
        }
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
        
        // 부모 컨테이너의 너비 업데이트
        if (element.parentElement && element.parentElement.classList.contains('vertical-writing')) {
            adjustContainerWidth(element.parentElement);
        }
    } 
    // 컨테이너 요소인 경우 (여러 span을 포함하는 vertical-writing 요소 등)
    else if (element.classList.contains('vertical-writing')) {
        // 내부의 모든 span에 적용
        const spans = element.querySelectorAll('span');
        spans.forEach(span => {
            span.style.fontSize = size + 'px';
        });
        
        // 컨테이너 너비 조정
        adjustContainerWidth(element);
    }
    // vertical-text 클래스를 가진 요소의 경우
    else {
        element.style.fontSize = size + 'px';
    }
}

// 컨테이너 너비를 내부 요소에 맞게 조정하는 함수
function adjustContainerWidth(container) {
    if (!container || !container.classList.contains('vertical-writing')) return;
    
    // 내부 요소 중 가장 넓은 요소의 너비를 찾음
    const spans = container.querySelectorAll('span');
    if (!spans.length) return;
    
    // 원래 컨테이너 너비 계산 (기본값 설정)
    let containerWidth = 0;
    
    // 각 span 내의 텍스트 길이에 따라 적절한 너비 결정
    spans.forEach(span => {
        const text = span.textContent;
        // 텍스트 길이에 따른 최소 필요 너비 추정
        const textLength = text.length;
        // 폰트 크기 가져오기
        const fontSize = parseInt(window.getComputedStyle(span).fontSize);
        
        // 문자 수와 폰트 크기를 기반으로 필요한 최소 너비 추정
        // 길이가 1인 경우, 폰트 크기의 약 1.2배
        // 길이가 2 이상인 경우, 폰트 크기의 약 1.5배로 설정하여 더 많은 여유 공간 확보
        let spanWidth = 0;
        if (textLength === 1) {
            spanWidth = fontSize * 1.2;
        } else {
            // 여러 글자인 경우, 자동 줄바꿈이 될 수 있도록 충분한 너비 확보
            // 너비를 좁게 유지하면서도 텍스트가 너비에 맞게 줄바꿈되도록 함
            spanWidth = Math.max(fontSize * 1.5, 40); // 최소 40px
        }
        
        // 컨테이너 너비 업데이트 (가장 넓은 요소 기준)
        if (spanWidth > containerWidth) {
            containerWidth = spanWidth;
        }
    });
    
    // 최종 너비 설정 (최소 40px, 최대 80px 사이로 제한)
    containerWidth = Math.max(40, Math.min(containerWidth, 80));
    
    // 컨테이너 너비 설정
    container.style.width = containerWidth + 'px';
    
    // 모든 span 요소에 적절한 스타일 적용
    spans.forEach(span => {
        const textLength = span.textContent.length;
        
        // 텍스트 길이에 따라 다른 스타일 적용
        if (textLength > 1) {
            // 여러 글자인 경우, 자동 줄바꿈 활성화
            span.style.wordBreak = 'break-all';
            span.style.overflowWrap = 'break-word';
            span.style.whiteSpace = 'normal';
        }
        
        // 모든 span에 너비 제한 설정
        span.style.maxWidth = (containerWidth - 10) + 'px'; // 패딩 고려
        span.style.width = '100%';
        span.style.boxSizing = 'border-box';
        span.style.textAlign = 'center';
    });
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