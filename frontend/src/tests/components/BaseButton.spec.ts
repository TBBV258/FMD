import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseButton from '@/components/common/BaseButton.vue'

describe('BaseButton', () => {
  it('renders with default props', () => {
    const wrapper = mount(BaseButton, {
      slots: {
        default: 'Click me'
      }
    })
    
    expect(wrapper.text()).toBe('Click me')
    expect(wrapper.classes()).toContain('btn-primary')
  })

  it('renders with secondary variant', () => {
    const wrapper = mount(BaseButton, {
      props: {
        variant: 'secondary'
      },
      slots: {
        default: 'Secondary'
      }
    })
    
    expect(wrapper.classes()).toContain('btn-secondary')
  })

  it('renders with outline variant', () => {
    const wrapper = mount(BaseButton, {
      props: {
        variant: 'outline'
      },
      slots: {
        default: 'Outline'
      }
    })
    
    expect(wrapper.classes()).toContain('btn-outline')
  })

  it('renders in different sizes', () => {
    const wrapperSm = mount(BaseButton, {
      props: { size: 'sm' },
      slots: { default: 'Small' }
    })
    
    const wrapperLg = mount(BaseButton, {
      props: { size: 'lg' },
      slots: { default: 'Large' }
    })
    
    expect(wrapperSm.classes()).toContain('px-3')
    expect(wrapperLg.classes()).toContain('px-6')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(BaseButton, {
      slots: {
        default: 'Click me'
      }
    })
    
    await wrapper.trigger('click')
    
    expect(wrapper.emitted()).toHaveProperty('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(BaseButton, {
      props: {
        disabled: true
      },
      slots: {
        default: 'Disabled'
      }
    })
    
    await wrapper.trigger('click')
    
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('shows loading state', () => {
    const wrapper = mount(BaseButton, {
      props: {
        loading: true,
        loadingText: 'Loading...'
      },
      slots: {
        default: 'Click me'
      }
    })
    
    expect(wrapper.text()).toBe('Loading...')
    expect(wrapper.find('.spinner').exists()).toBe(true)
  })

  it('applies full width class when fullWidth is true', () => {
    const wrapper = mount(BaseButton, {
      props: {
        fullWidth: true
      },
      slots: {
        default: 'Full Width'
      }
    })
    
    expect(wrapper.classes()).toContain('w-full')
  })
})

