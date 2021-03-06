/** @jsx h */
import { h } from 'preact'
import '../../scss/base.scss'
import styles from './divider.scss'

export function Divider (props) {
  return <hr {...props} class={styles.divider} />
}
