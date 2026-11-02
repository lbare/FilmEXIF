import { Button, Card, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { Check } from '@phosphor-icons/react'
import { Link } from 'react-router'
import { useData } from '../data/DataProvider'

/** First-run checklist: camera → film → load a roll. */
export function Onboarding() {
  const { cameras, films, rolls } = useData()
  const steps = [
    {
      done: cameras.length > 0,
      title: 'Add a camera',
      body: 'Its shutter range sets the speeds you can pick when logging.',
      to: '/gear?new=camera',
      cta: 'Add camera',
    },
    {
      done: films.length > 0,
      title: 'Stock your fridge',
      body: 'Optional: track the film you have on hand, its expiry and price.',
      to: '/fridge',
      cta: 'Add film',
    },
    {
      done: rolls.length > 0,
      title: 'Load a roll',
      body: 'Then log each frame as you shoot. Location and time are added for you.',
      to: '/rolls/new',
      cta: 'Load roll',
    },
  ]
  const next = steps.findIndex((s) => !s.done)

  return (
    <Card p="lg">
      <Title order={3} mb={4}>
        Welcome to FilmEXIF
      </Title>
      <Text c="dimmed" size="sm" mb="lg">
        Three quick steps and you’re ready to shoot.
      </Text>
      <Stack gap="md">
        {steps.map((s, i) => (
          <Group key={s.title} wrap="nowrap" align="flex-start">
            <ThemeIcon radius="xl" size={28} variant={s.done ? 'filled' : i === next ? 'light' : 'default'} color={s.done ? 'teal' : undefined}>
              {s.done ? <Check size={16} weight="bold" /> : <Text size="sm" fw={700}>{i + 1}</Text>}
            </ThemeIcon>
            <Stack gap={4} style={{ flex: 1 }}>
              <Text fw={600} td={s.done ? 'line-through' : undefined} c={s.done ? 'dimmed' : undefined}>
                {s.title}
              </Text>
              {!s.done && (
                <Text size="sm" c="dimmed">
                  {s.body}
                </Text>
              )}
              {i === next && (
                <Group gap="xs" mt={4}>
                  <Button component={Link} to={s.to} size="sm">
                    {s.cta}
                  </Button>
                  {i === 1 && (
                    <Button component={Link} to="/rolls/new" size="sm" variant="subtle">
                      Skip, load a roll
                    </Button>
                  )}
                </Group>
              )}
            </Stack>
          </Group>
        ))}
      </Stack>
    </Card>
  )
}
