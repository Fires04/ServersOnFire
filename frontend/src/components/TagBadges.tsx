import { Badge, Group } from '@mantine/core'
import type { Tag } from '../types'

export default function TagBadges({ tags, size = 'sm' }: { tags: Tag[]; size?: string }) {
  if (tags.length === 0) return null
  return (
    <Group gap={6}>
      {tags.map((tag) => (
        <Badge
          key={tag.name}
          size={size}
          // "dot" keeps badge text on the normal theme text color regardless
          // of how light/dark the tag's own color is — a filled background
          // from an arbitrary NetBox hex can't be relied on for contrast.
          variant={tag.color ? 'dot' : 'outline'}
          color={tag.color ? `#${tag.color}` : 'gray'}
        >
          {tag.name}
        </Badge>
      ))}
    </Group>
  )
}
