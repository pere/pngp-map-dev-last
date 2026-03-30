//@ts-nocheck
//@ts-ignore
export default {
	chart: {
		type: 'column',
		height: 'auto',
		fontFamily: 'Lato',
		backgroundColor: '#bdc1c6',
	},

	subtitle: {
		text: null,
	},
	xAxis: {
		categories: [],
		title: {
			text: null,
			style: {
				fontSize: '.8rem',
				fontFamily: 'Lato',
				color: 'white',
			},
		},
		labels: {
			enabled: true,
			style: {
				fontFamily: 'Lato',
				fontSize: '.7rem',
				fontWeight: 'thin',
				fontStyle: 'normal', // 'normal', 'italic', 'oblique'
				color: 'white',
				textDecoration: 'none', // 'none', 'underline', 'overline', 'line-through'
				textTransform: 'uppercase', // 'none', 'capitalize', 'uppercase', 'lowercase'
				textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
			},
		},
		crosshair: true,
	},
	yAxis: [
		{
			title: {
				useHTML: true,
				text: '<span style="color:#1e946f">Richness</span> - <span style="color:#3b81bf">Shannon Index</span> ',
				style: {
					/* 	color: '#00d492', */
					fontSize: '.8rem',
					fontFamily: 'Lato',
					textTransform: 'uppercase',
				},
			},
			labels: {
				useHTML: true,
				id: 'richness',
				style: {
					fontFamily: 'Lato,Arial, Helvetica, sans-serif',
					fontSize: '12px',
					fontWeight: 'thin',
					fontStyle: 'normal', // 'normal', 'italic', 'oblique'
					color: '#fff',
					textDecoration: 'none', // 'none', 'underline', 'overline', 'line-through'
					textTransform: 'uppercase', // 'none', 'capitalize', 'uppercase', 'lowercase'
					textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
				},
			},
		},
		{
			title: {
				useHTML: true,
				id: 'abundance',
				text: 'Abundance',
				style: {
					fontFamily: 'Lato,Arial, Helvetica, sans-serif',
					fontSize: '13px',

					fontWeight: 'thin',
					fontStyle: 'normal', // 'normal', 'italic', 'oblique'
					color: '#d14edb',
					textDecoration: 'none', // 'none', 'underline', 'overline', 'line-through'
					textTransform: 'uppercase', // 'none', 'capitalize', 'uppercase', 'lowercase'
					textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
				},
			},
			labels: {
				useHTML: true,
				id: 'shannon',
				style: {
					fontFamily: 'Lato,Arial, Helvetica, sans-serif',
					fontSize: '8px',
					fontWeight: 'thin',
					fontStyle: 'normal', // 'normal', 'italic', 'oblique'
					color: '#d8d9d7',
					textDecoration: 'none', // 'none', 'underline', 'overline', 'line-through'
					textTransform: 'uppercase', // 'none', 'capitalize', 'uppercase', 'lowercase'
					textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
				},
			},
			opposite: true,
		},
	],
	tooltip: {
		shared: true,
		useHTML: true,
		outside: true,
		zIndex: 9999,
		distance: 10, // Positive = right, Negative = left

		style: {
			fontFamily: 'Lato',
			color: 'black',
		},
		formatter: function () {
			let tooltip = `<div style="z-index:100000;display:grid; grid-template-columns:1fr;overflow:none;">
            <div  style="font-size:1.4rem" class="text-center w-full mb-2 background-color:${this.color}">${this.category}</div>

            `;
			this.points.forEach((point) => {
				tooltip += `<div style="display:flex; flex-direction:row;align-items:center;">`;
				const value = point.y === 0 ? 'N/A' : point.y;
				tooltip += `<div class="mr-1 w-2 h-2 rounded-full" style="background-color:${point.color};"></div>
                                 <div> ${point.series.name}: <b>${value}</b>
                                 </div>`;
				tooltip += `</div>`;
			});
			tooltip += `
            </div>`;

			return tooltip;
		},
	},
	plotOptions: {
		series: {
			borderRadius: 3,
			borderWidth: 0.5,
			borderColor: 'white',
		},
		column: {
			dataLabels: {
				enabled: false,
				style: {
					fontFamily: 'Lato',
				},
			},
		},
	},
	series: [],
	legend: {
		enabled: false,
		itemStyle: {
			fontFamily: 'Lato',
		},
		/* 		align: 'center',
		verticalAlign: 'bottom',
		backgroundColor: '#FFFFFF',
		borderColor: '#CCC',
		borderWidth: 1,
		shadow: false,
		itemStyle: {
			fontSize: '12px',
		}, */
	},
	credits: {
		enabled: false,
	},
};
