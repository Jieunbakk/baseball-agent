// KBO 크롤러 — Playwright로 동적 렌더링 페이지 파싱
// KBO 공식 사이트는 JS 렌더링 SPA이므로 headless Chromium 사용
import { chromium } from 'playwright'
import * as cheerio from 'cheerio'

export interface GameInfo {
  gameId: string
  date: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  inning: string
  status: 'pre' | 'live' | 'final'
}

// KBO 구단 정규화 매핑
const TEAM_MAP: Record<string, string> = {
  'LG': 'LG', 'lg': 'LG',
  '한화': '한화',
  'SSG': 'SSG', 'ssg': 'SSG',
  '삼성': '삼성',
  'NC': 'NC', 'nc': 'NC',
  'KT': 'KT', 'kt': 'KT',
  '롯데': '롯데',
  'KIA': 'KIA', 'kia': 'KIA',
  '두산': '두산',
  '키움': '키움',
}

function todayStr(): { yyyymmdd: string; isoDate: string; mmdd: string } {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return {
    yyyymmdd: `${y}${m}${day}`,
    isoDate: `${y}-${m}-${day}`,
    mmdd: `${m}.${day}`,
  }
}

function normalizeTeam(raw: string): string {
  const t = raw.trim().replace(/\s+/g, '').replace(/\(.*?\)/g, '')
  for (const [key, val] of Object.entries(TEAM_MAP)) {
    if (t.includes(key)) return val
  }
  return t
}

function isKboTeam(name: string): boolean {
  return Object.values(TEAM_MAP).includes(name)
}

export async function fetchTodayGames(): Promise<GameInfo[]> {
  const { yyyymmdd, isoDate, mmdd } = todayStr()
  let browser = null

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    })

    const page = await browser.newPage()
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'ko-KR,ko;q=0.9' })

    // 기본 URL로 접근 — 한 달치 스케줄이 렌더링됨
    // (gameDate 파라미터 사용 시 빈 결과 반환되는 사이트 버그 회피)
    await page.goto(
      'https://www.koreabaseball.com/Schedule/Schedule.aspx',
      { waitUntil: 'networkidle', timeout: 30000 },
    )

    // 테이블 렌더링 대기 (최대 8초)
    await page.waitForSelector('#tblScheduleList tbody tr', { timeout: 8000 }).catch(() => {})

    const html = await page.content()
    await browser.close()
    browser = null

    const games = parseScheduleHtml(html, yyyymmdd, isoDate, mmdd)
    console.log(`[KBO 크롤러] ${games.length}경기 파싱 완료 (${isoDate})`)
    return games

  } catch (err) {
    console.error('[KBO 크롤러] 오류:', err instanceof Error ? err.message : err)
    return []
  } finally {
    if (browser) await browser.close().catch(() => {})
  }
}

function parseScheduleHtml(
  html: string,
  yyyymmdd: string,
  isoDate: string,
  mmdd: string,
): GameInfo[] {
  const $ = cheerio.load(html)
  const games: GameInfo[] = []

  // 실제 KBO 테이블 ID: tblScheduleList
  const rows = $('#tblScheduleList tbody tr')

  if (rows.length === 0) {
    console.warn('[KBO 크롤러] #tblScheduleList 테이블을 찾지 못했습니다.')
    return []
  }

  let currentDate = ''

  rows.each((_, row) => {
    const $row = $(row)
    const cells = $row.find('td')

    // "데이터가 없습니다." 행(colspan=9) 스킵
    if (cells.length <= 1) return

    // td.day 셀이 있으면 현재 날짜 업데이트 (rowspan 처리)
    const $firstCell = cells.first()
    if ($firstCell.hasClass('day')) {
      currentDate = $firstCell.text().trim()  // "05.16(토)" 형태
    }

    // 오늘 날짜 필터 — mmdd("05.16")로 비교
    if (currentDate && !currentDate.startsWith(mmdd)) return

    // td.play 셀 찾기 (경기 정보)
    const $playCell = $row.find('td.play')
    if ($playCell.length === 0) return

    // 팀명: td.play > span (직접 자식 span만, em 제외)
    const $teamSpans = $playCell.children('span')
    if ($teamSpans.length < 2) return

    const awayTeam = normalizeTeam($($teamSpans[0]).text())
    const homeTeam = normalizeTeam($($teamSpans[$teamSpans.length - 1]).text())

    if (!isKboTeam(awayTeam) || !isKboTeam(homeTeam)) return

    // 스코어 및 상태 파싱
    const $em = $playCell.find('em')
    const $scoreSpans = $em.find('span')
    const emText = $em.text().replace(/\s/g, '')

    let awayScore = 0
    let homeScore = 0
    let status: 'pre' | 'live' | 'final' = 'pre'

    if (emText === 'vs' || $scoreSpans.length === 0) {
      // 경기 전: em 안에 "vs" 텍스트만 있음
      status = 'pre'
    } else {
      // 스코어 있음 — 첫 번째 숫자=어웨이, 마지막 숫자=홈
      // 구조: <span class="lose">1</span><span>vs</span><span class="win">5</span>
      const firstScore = parseInt($($scoreSpans[0]).text())
      const lastScore = parseInt($($scoreSpans[$scoreSpans.length - 1]).text())
      if (!isNaN(firstScore)) awayScore = firstScore
      if (!isNaN(lastScore)) homeScore = lastScore

      // relay 셀에 "리뷰" 버튼이 있으면 종료된 경기
      const relayText = $row.find('td.relay').text()
      status = relayText.includes('리뷰') ? 'final' : 'live'
    }

    games.push({
      gameId: `${yyyymmdd}_${awayTeam}_${homeTeam}`,
      date: isoDate,
      awayTeam,
      homeTeam,
      awayScore,
      homeScore,
      inning: status === 'pre' ? '경기 전' : status === 'final' ? '종료' : '진행 중',
      status,
    })
  })

  return games
}
