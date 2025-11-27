import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { getFaqs, type Faq } from '../services/faqs'

const ContactPage: FC = () => {
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [faqsError, setFaqsError] = useState<string | null>(null)

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        setFaqsError(null)
        const data = await getFaqs()
        setFaqs(data)
      } catch (error) {
        setFaqsError((error as Error).message)
      }
    }

    void loadFaqs()
  }, [])
  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200 min-h-[calc(100vh-120px)]">
      <div className="relative flex w-full flex-col overflow-x-hidden">
        <main className="flex-grow">
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-14 lg:py-16">
            {/* Heading Section */}
            <div className="text-center mb-12 md:mb-16">
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
                Contáctanos
              </h1>
              <p className="mt-4 text-base md:text-lg leading-8 text-gray-600 dark:text-gray-400">
                ¿Necesitas ayuda? Estamos aquí para ti. Rellena el formulario o visita nuestra tienda.
              </p>
            </div>

            {/* Contact Form & Info Section */}
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
              {/* Form */}
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <label className="flex flex-col">
                    <p className="font-display text-base font-medium leading-normal pb-2 text-gray-900 dark:text-white">
                      Nombre
                    </p>
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-gray-700 h-12 placeholder:text-gray-500 dark:placeholder:text-gray-400 px-3 text-base font-normal leading-normal"
                      placeholder="Ingresa tu nombre completo"
                      type="text"
                    />
                  </label>
                  <label className="flex flex-col">
                    <p className="font-display text-base font-medium leading-normal pb-2 text-gray-900 dark:text-white">
                      Email
                    </p>
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-gray-700 h-12 placeholder:text-gray-500 dark:placeholder:text-gray-400 px-3 text-base font-normal leading-normal"
                      placeholder="tu.correo@ejemplo.com"
                      type="email"
                    />
                  </label>
                </div>
                <label className="flex flex-col">
                  <p className="font-display text-base font-medium leading-normal pb-2 text-gray-900 dark:text-white">
                    Asunto
                  </p>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-gray-700 h-12 placeholder:text-gray-500 dark:placeholder:text-gray-400 px-3 text-base font-normal leading-normal"
                    placeholder="Sobre qué quieres hablar"
                    type="text"
                  />
                </label>
                <label className="flex flex-col">
                  <p className="font-display text-base font-medium leading-normal pb-2 text-gray-900 dark:text-white">
                    Mensaje
                  </p>
                  <textarea
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-gray-700 min-h-36 placeholder:text-gray-500 dark:placeholder:text-gray-400 px-3 text-base font-normal leading-normal"
                    placeholder="Escribe tu consulta aquí..."
                  />
                </label>
                <button
                  type="button"
                  className="flex items-center justify-center font-bold text-white h-12 px-6 rounded-lg bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background-light dark:focus:ring-offset-background-dark transition-colors w-full sm:w-auto"
                >
                  Enviar Mensaje
                </button>
              </div>

              {/* Contact Info */}
              <div className="flex flex-col space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <span className="material-symbols-outlined">phone</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white">Teléfono</h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">+51 987 654 321</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <span className="material-symbols-outlined">mail</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white">Soporte</h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">soporte@techstore.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <span className="material-symbols-outlined">schedule</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white">Horario de Atención</h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">Lunes a Sábado: 9:00 AM - 8:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Store Image Section */}
            <div className="mt-16 md:mt-20 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
              {/* Map */}
              <div className="flex flex-col">
                <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Visítanos en Miraflores
                </h2>
                <div className="mt-6 aspect-video w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                  <img
                    className="h-full w-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKIi24Tv51ldiBy7F4LPVOK4taxBZAPmtKggZPVSZxyu6o-OsyZAE7tBZ02x2M-dhgc7_OqSjAFwW_DePEXzQrrRynhDwcFJZrjYWh7Gj0FlIz08UxkOd-5lOKBymNo8NRB5iU4uxp82hAuCAe7gbYAQdqOLd5x_3qLpFV5TX6Yk6VplIB3cjLIW-yryoBwydoDvOTPiK0Vk4_MT3_hkOJDze1H2RisOC5Aeho02dq2PDqzeS9Q2ske188yafzjGFQ0YqpiCpbF5M"
                    alt="Mapa aéreo de una zona urbana con calles y edificios."
                  />
                </div>
                <p className="mt-4 text-base text-gray-600 dark:text-gray-400">
                  Av. Larco 123, Miraflores, Lima, Perú
                </p>
              </div>

              {/* Store Image */}
              <div className="flex flex-col">
                <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Nuestra Casa
                </h2>
                <div className="mt-6 aspect-video w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                  <img
                    className="h-full w-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeJmy2-rqsyoX5R7xnE7CsaU-2HNpssjhDbS8opc9QeshLcGylSnQIlKD2NBCOPzJ6NNot9w8Tbbc9rn-iGS3Jil09vL2vatpEK0G0DgGe2NyIsrW2Up3EIfRuCd3RMCQHKugKeWUHBhOFG9Cdb3g-91g__gc_NTv0eSyssMOEUzdX2sc-FdrjTpwWYR5PbXxWntcSL8KrMeGHFI5LWFRzpdLsOs8SpvZV8ZATHmayNVz1EAZ3l_SZM78xDB89iwUm2-bDbspn99w"
                    alt="Interior de una tienda moderna de tecnología con estantes iluminados mostrando productos electrónicos."
                  />
                </div>
                <p className="mt-4 text-base text-gray-600 dark:text-gray-400">
                  Un espacio diseñado para que encuentres la mejor tecnología.
                </p>
              </div>
            </div>

            {/* FAQ Section */}
            <section className="mt-16 md:mt-20 mb-10">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Preguntas Frecuentes
                </h2>
                <p className="mt-4 text-base md:text-lg leading-8 text-gray-600 dark:text-gray-400">
                  Encuentra respuestas a las dudas más comunes de nuestros clientes.
                </p>
              </div>

              {faqsError && (
                <p className="mt-6 text-sm text-red-500 text-center">{faqsError}</p>
              )}

              <div className="mt-10 md:mt-12 space-y-4">
                {faqs.map((faq) => (
                  <details
                    key={faq.id}
                    className="group rounded-lg bg-gray-50 p-6 dark:bg-white/5 [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-gray-900 dark:text-white">
                      <h3 className="text-base md:text-lg font-medium">{faq.pregunta}</h3>
                      <span className="relative h-5 w-5 shrink-0">
                        <span className="material-symbols-outlined absolute inset-0 opacity-100 group-open:opacity-0">
                          add
                        </span>
                        <span className="material-symbols-outlined absolute inset-0 opacity-0 group-open:opacity-100">
                          remove
                        </span>
                      </span>
                    </summary>
                    <p className="mt-4 leading-relaxed text-gray-700 dark:text-gray-300 text-sm md:text-base">
                      {faq.respuesta}
                    </p>
                  </details>
                ))}

                {faqs.length === 0 && !faqsError && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
                    Aún no hay preguntas frecuentes registradas.
                  </p>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ContactPage
