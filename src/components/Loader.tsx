import React from "react"
import styles from './Loader.module.css'

/*
  Loader adaptado al esquema de colores del proyecto.
  Se expone como componente reutilizable.
*/
const Loader: React.FC = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.loader}>
        <div className={`${styles.box} ${styles.box0}`}><div /></div>
        <div className={`${styles.box} ${styles.box1}`}><div /></div>
        <div className={`${styles.box} ${styles.box2}`}><div /></div>
        <div className={`${styles.box} ${styles.box3}`}><div /></div>
        <div className={`${styles.box} ${styles.box4}`}><div /></div>
        <div className={`${styles.box} ${styles.box5}`}><div /></div>
        <div className={`${styles.box} ${styles.box6}`}><div /></div>
        <div className={`${styles.box} ${styles.box7}`}><div /></div>
        <div className={styles.ground}><div /></div>
      </div>
    </div>
  )
}
export default Loader
