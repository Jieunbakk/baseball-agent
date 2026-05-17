// Claude API로 득점/경기 종료 시 귀여운 반응 메시지 생성
import Anthropic from '@anthropic-ai/sdk'
import type { ScoreEvent } from './score-tracker'

// Claude API 없을 때 사용할 기본 메시지 템플릿
function fallbackMessage(event: ScoreEvent): string {
  const { game, type, scoringTeam, isOurTeam } = event
  const score = `${game.awayTeam} ${game.awayScore}:${game.homeScore} ${game.homeTeam}`

  if (type === 'final') {
    return isOurTeam ? `${scoringTeam} 승리!! 🎉 ${score}` : `내일은 잘해보자^^ 💪 ${score}`
  }
  return isOurTeam
    ? `${scoringTeam} 득점!! 🎉 ${score}`
    : `상대팀 ${scoringTeam} 득점... 😅 ${score}`
}

// Claude API로 귀여운 반응 생성 (50자 이내)
export async function generateMessage(
  event: ScoreEvent,
  apiKey: string,
): Promise<string> {
  const { game, type, scoringTeam, isOurTeam } = event
  const score = `${game.awayTeam} ${game.awayScore}:${game.homeScore} ${game.homeTeam}`

  // 응원 상황에 맞는 프롬프트 작성
  let situation: string
  if (type === 'final') {
    if (isOurTeam) {
      situation = `응원팀 ${scoringTeam}이 승리했어요! 스코어: ${score}`
    } else {
      situation = `응원팀이 ${scoringTeam}에게 패배했어요. 스코어: ${score}`
    }
  } else {
    if (isOurTeam) {
      situation = `응원팀 ${scoringTeam}이 득점했어요! 현재 스코어: ${score}`
    } else {
      situation = `상대팀 ${scoringTeam}이 득점했어요. 현재 스코어: ${score}`
    }
  }

  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: process.env['CLAUDE_MODEL'] ?? 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      system: [
        {
          type: 'text',
          // 캐릭터 고정: 귀여운 야구공 캐릭터
          text: '당신은 야구를 열정적으로 좋아하는 귀엽고 통통 튀는 야구공 캐릭터입니다. 반응은 무조건 30자 이내, 이모지 1~2개 포함, 한국어로만 응답하세요.',
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: situation }],
    })

    const text =
      response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    // 50자 초과 방지
    return text.slice(0, 50) || fallbackMessage(event)
  } catch (err) {
    console.error('[KBO 알림] Claude API 실패, 기본 메시지 사용:', err instanceof Error ? err.message : err)
    return fallbackMessage(event)
  }
}
