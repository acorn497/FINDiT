# FINDiT

교내 분실물 등록·매칭 웹 서비스 **FINDiT(파인딧)**.

잃어버린 사람이 올리는 **분실 신고**와 주운 사람이 올리는 **습득 등록**을 한곳에 모으고,
비교해 볼 만한 것을 **후보**로 보여 준다. 최종 판단과 전달은 항상 사람이 한다.

> 작업 중인 저장소입니다. 실행 방법은 단계가 진행되면서 채웁니다.

## 실행

```bash
docker compose up --build -d     # db · api · web
open http://localhost:8080
```

## 테스트

```bash
./scripts/test-all.sh            # FE 단위 / BE 단위·e2e 를 별도 compose 프로젝트에서 실행
```
