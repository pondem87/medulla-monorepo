import { assign, createMachine } from "xstate";
import { ZimMobilePaymentMethods } from "../common/constants";
import { Contact } from "./dto/contact.dto";

export const InteractiveStateMachine = createMachine(
	{
		/** @xstate-layout N4IgpgJg5mDOIC5QEsB2AXMAnAhgY3WQDcwA6ACwHsBbMAYlnRy3QFlKAjZAGzAAUcAT1oYA2gAYAuolAAHSrGSFKqGSAAeiALQBmAEwAWUgE5xOgGwGArDvHiA7AbMAaEIO0HLpAIzm-V83tAqwAOc3FzAF9I1zRMXAJiMipaBiYWdi5eAWEwMW9pJBB5RWVVIs0ELT0dIx1vY3tvHXq7YzCQ13cqgz09UhCW-Ws9P3EDA2jYjGx8QhIKGnpGZnQAMR4wdggwCUK5BSVkFTVKrQMQ-qDbPWNjcwDQqy7tYytSeyHxdr0QkPtvpMYiA4rNEgsUvQAK6ybiUHA7CAbXh7NQlI4nCraKx6d7tAw6T5-bxWKwXF49Qw+PzBewhUm4kJTEEzBLzMgAL2Q1EymxyInQdDwOFQeDA3H5eXQqKK6LKp20egipBxv0J9jJxn0xgp1U+AyGOisd3Mt0uzNBbKSpC5PM4fKEAtIKxYkowdBw1EoUIwAGUwNKpGjDvKsQgyUYrHZozV7oFdRZ+tHxN4IoEzN4Lay5tbbbzso6pc70ug3YLPd6-QHRAVg6VjuVQJUyeYBsbPIFjIYUzoE30PgSWnYdHdjBMs-Ecws8-aC7kMKQ8FQFFsA1QIHRaOh1wBhKiwPIyg71zFNxCfeykZN2WN+ey67ukQxfMyjiZ6Cdg9k27n5-iFhcl0oFdWDXSgNy3Xd90PWtZRDBsFQQRxjBVa9b3jNxtAaS9HBfEc7nfT8rWnX9Z3-ed0GdAMADkoWoDhsDoVA6IYrB-UDfZing08NHPHEnxCUwUwBaxU3vTCqm8JUn0HWxXwI3oiKnTlSKycinQPdBaPoxjmJ0tjq1g48MUbXikICEwQgmRNHEufRdRCcQZLwt9FOBS1lJ-O01LLKj0AAUWoHAeDoMAgp4dijy4k9TMqQZ+npLUNXQ8TuipDUaRNaNSSZdzs3BFTvIdCi-MC4LuFC8LuEiozopMxDjG8S9r3EFKKQeJ8AlNAI9FTBxPCUgqvL-XzZCwSgxVgWAyzoCAVDINAiEoABrBb8u-GcfIAyixomuBpu2hBFomnAyj2KK5QQsNdFuA1DV+OxHG8XUmu8D49E+bxU2sB4rPsQaNtU4qnV2yaDoo0KsHGrBSFhU6ADNKCwahSA8obNuBotQf2ssjtQJbhTOqQLu42LEBqZq0JHGlBl1Aw3oMLUWkEwJ7A1RqAeteHNgAVVheEN2FUVxWRMA+bhBESZixCtHMWxSBpQJbm8JwlU6CTdDlhXRisDLfFsMlOYWbneHFgW-Ooz16FQK3IqDODpeuxqUN6Owwh0FmaQTfVfDvFtjXMAijbIE2xf5hFFxUbnkct1IhbFbhY92e3jNDM9JIcfoSUamw-FqUZUu0A3qUy5oJgiXLpknIbQ7NiO8Cj5AY6toVG+b2gpfq66Oh8TUozJKzHofJqFcagEpJxVqAmD0ha-DiBSBt2gdzb2gN07tOzK0MSk0GCZA61cYdQ1+nSEZlo2a+gxbN1mfQ+2egwHUJRRYfjervT84LBVKT7kaQdPD3D7KQfQgQmpkhVr4Y0d9NgP2dGgKAvBRYACUcBQAfgwAMABBbg3BRawFQeg8CydOKXR4mcfQzVehWC+hqJoJJ1bdFJG9X2fgnBmHHv9PK1dvz32IfA1AiCwAoLQXA0OhCMEcHwMtAAKpQAAMsgRg79yFYWHKhD2EQxwRHEAECk+cZIfRyjYRmmZuFfi5rA-hihBFIM2BI-h3AlHrE2LAOgTjGDsCwMI1xKiyZVE+P0RmUZxB-AeufCkhg3qBBaEJXR5gpJcKrhY42VidgCKESIoh6SPEuN4G4g8vACCQFFn4mW9g7i9w9k1Xof0jT6PGD4T4HsEmmBzuOcxxEQ5pLIDYzJ9jRH8NDlgxIKg6BSLwLIhRziynd1xD4XEuI6Q0IuOYRhiAPbvF6C0Jw9NrAXFxDA3gcC+l2N4A49JwzRmoEwegQhpSU51U3mcQOTkCS4l8NYRwBJj7dGsG8motRei3EMKSI5Wx+H+iKXkiFOxbm+gQWcsAFySF1i7p-I0l5RimEcEsr6oQKRNRQlGGkFxAG9SNOCuBUKwAEFfsQ25OC8GuJRbMjFFwnyEkuNcGonhr76N6IYxwGpUy-C7DoKl-CmX4JRfCxFPjzmDJ2Gyre-yBhNTWYHC4QR1kIFMSqQS7QpLeD+LUW+zJUDEPgEUNG7I0XPKwr4EIvcc4WDlr0DC3QtDMIVjSXWpJLCCSBMkrpixaD2o-qq0JT45ZmBTKMKSBgEwcsNY0KM9IvrGBnhjOcAoI2qIQCrd4TRxi9UaGsiwVk6bGmckOS4fxGiOGzUDXNRYXSlm2vm-xDQdAfG+mWnVlak0a0JG9XCQ55JjmDSyHhuYW3qSLEBECYEIBdsQqmQSV5WmeG1GEXoD43hn1HG8Jwlx6ZjmbUVVtC5NLaVYmusMeyt0NB3WaSwegXp0ivI9UdIQi3T06Z5HNC6b0BjKjwB96cN1ZyaLYcIJbkovQaAOIYGp-kWHppeka21YbjTBmWSDZklRGAiC+uWb76a6tqJ1fwdwbC-F+FYcFddV0O3RVvL60ls4kjdfnT1Hhwi+rvN1bVLRmPzwtlbQjZxUy6z7R7Jwpo2Z-vMN7XtrC0MPD-hewDNdeYSYbqgaO1Ak7Se0FZSMfci31Fsg+f4KpFZWT-XSCVuneH6YlgvJeYAV5GabmvMzGcvCBECE5k13zh6XkDk1eNk9cRRDc5Y45xDAvb1TL2xyVkp2Kd0c8CSZImktAeDYe4fRrCSvSachVyKlVgFS7J94mXGYTBy6SQlp8Ym8cY4yD8iXUnJcq-KrJYiBnZLq2xh1GcHADFCc18u4Q9ESTVdsoFfQuzWCY317pA3elDdG3A3J+DUuCX6DiQkrV2ihL-cOtKt0mpFfobiseFXdu2Oqyi2emwRmbzIf42W8ty76EErrFr+iKmFaNGOP4ZgBpbc+zt0gNK6U9NS-UFCH01ljhaTQlwElRhOTsH4RysmS3TttUl2FZBpUstq6j+kAxHJKnaBYN4JIKT0zeqEO4jl+6tXsL16IQA */
		id: "interactive",
		types: {
			events: {} as ISMEventType,
			context: {} as ISMContext,
			input: {} as {
				contact: Contact
			}
		},
		context: ({input}) => ({
			contact: input.contact,
			filePagination: { page: 0 }
		}),
		states: {
			home: {
				on: {
					startMobilePayment: [{
						target: "zimMobilePayment",
						guard: "hasZimNumber"
					}, {
						target: "home",
						actions: "sendMobilePaymentUnavailableMessage"
					}],

					startFileMode: {
						target: "fileMode"
					},

					uploadedFile: {
						target: "fileUpload"
					}
				}
			},
			zimMobilePayment: {
				states: {
					startPayment: {
						on: {
							amountSet: [{
								target: "chooseMethod",
								guard: "zmpAmountValid"
							}, "startPayment"]
						}
					},

					chooseMethod: {
						entry: [
							assign(({context, event}) => ({
								payment: {
									...context.payment,
									amount: event.type == "amountSet" ? parseFloat(event.amount) : undefined
								}
							}))
						],
						on: {
							methodChosen: [{
								target: "setNumber",
								guard: "zmpMethodValid"
							}, "chooseMethod"]
						}
					},

					setNumber: {
						entry: [
							assign(({context, event}) => ({
								payment: {
									...context.payment,
									method: event.type === "methodChosen" ? event.method : undefined
								}
							}))
						],
						on: {
							numberSet: [{
								target: "setEmail",
								guard: "zmpNumberValid"
							}, "setNumber"]
						}
					},

					setEmail: {
						entry: [
							assign(({context, event}) => ({
								payment: {
									...context.payment,
									number: event.type === "numberSet" ? event.number : undefined
								}
							}))
						],
						on: {
							emailSet: [{
								target: "processPayment",
								guard: "zmpEmailValid"
							}, "setEmail"]
						}
					},

					processPayment: {
						entry: [
							assign(({context, event}) => ({
								payment: {
									...context.payment,
									email: event.type === "emailSet" ? event.email : undefined
								}
							}))
						],
						on: {
							paymentSent: {
								target: "#interactive.home"
							},
							paymentError: {
								target: "startPayment"
							}
						}
					}
				},

				initial: "startPayment",

				on: {
					cancelPayment: {
						target: "home",
						actions: "sendPaymentCancelledMessage"
					}
				}
			},
			fileUpload: {
				states: {
					setName: {
						on: {
							nameSet: "confirmName"
						}
					},

					confirmName: {
						on: {
							cancelName: "setName",
							confirmName: "nameConfirmed"
						}
					},

					nameConfirmed: {
						always: {
							target: "#interactive.fileMode.singleFileRagMode.fileRagMode",
							reenter: true
						}
					}
				},

				on: {
					cancelFileUpload: {
						target: "home",
						actions: "deleteUploadedFile"
					}
				},

				initial: "setName"
			},
			fileMode: {
				states: {
					singleFileRagMode: {
						states: {
							fileRagMode: {
								on: {
									backToList: "listFiles"
								}
							},

							listFiles: {
								on: {
									listMoreFiles: "listFiles",
									selectedFile: "fileAction"
								}
							},

							fileAction: {
								on: {
									backToList: "listFiles",
									setRagFile: "fileRagMode"
								}
							}
						},

						initial: "listFiles",

						on: {
							setAllFilesRagMode: "AllFilesRagMode"
						}
					},

					SelectFileMode: {
						on: {
							setSingleFileRagMode: "singleFileRagMode",
							setAllFilesRagMode: "AllFilesRagMode"
						}
					},

					AllFilesRagMode: {
						on: {
							setSingleFileRagMode: "singleFileRagMode"
						}
					}
				},

				initial: "SelectFileMode",

				on: {
					exitFileMode: "home"
				}
			}
		},

		initial: "home"
	}, {
	guards: {
		hasZimNumber: ({ context }) => {
			return /^263/.test(context.contact.wa_id)
		},
		zmpAmountValid: ({event}) => {
			if (event.type === "amountSet") {
				const amount = parseFloat(event.amount)
				return !isNaN(amount) && amount > 0
			} else {
				return false
			}
		},
		zmpMethodValid: ({event}) => {
			if (event.type === "methodChosen") {
				return ZimMobilePaymentMethods.includes(event.method)
			} else {
				return false
			}
		},
		zmpNumberValid: ({event}) => {
			if (event.type === "numberSet") {
				return /^07\d{8}$/.test(event.number)
			} else {
				return false
			}
		},
		zmpEmailValid: ({event}) => {
			if (event.type === "emailSet") {
				return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(event.email)
			} else {
				return false
			}
		}
	}
})

export type ISMEventType =
	{ type: "startMobilePayment" } |
	{ type: "amountSet"; amount: string } |
	{ type: "uploadedFile" } |
	{ type: "cancelFileUpload" } |
	{ type: "methodChosen"; method: string } |
	{ type: "numberSet"; number: string } |
	{ type: "emailSet"; email: string } |
	{ type: "paymentSent" } |
	{ type: "paymentError" } |
	{ type: "cancelPayment" } |
	{ type: "nameSet" } |
	{ type: "cancelName" } |
	{ type: "confirmName" } |
	{ type: "startFileMode" } |
	{ type: "backToList" } |
	{ type: "listMoreFiles" } |
	{ type: "selectedFile" } |
	{ type: "setRagFile" } |
	{ type: "setAllFilesRagMode" } |
	{ type: "setSingleFileRagMode" } |
	{ type: "exitFileMode" }

export type ISMContext = {
	contact: Contact,
	payment?: {
		method?: string,
		email?: string,
		number?: string,
		amount?: number
	},
	uploadedFile?: {
		id: string,
		name?: string 
	},
	selectedFile?: {
		id: string
	},
	filePagination: {
		page: number
	}
}