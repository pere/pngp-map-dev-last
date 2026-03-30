//@ts-nocheck
//@ts-ignore
export default {
	chart: {
		/* spacingBottom: 30,
		marginBottom: 50, */
		/* spacingBottom: 5,
		spacingTop: 5,
		marginBottom: 55, */
		/* marginLeft: 5,
		marginRight: 8, */
		marginTop: 12,
		spacingTop: 15,
		type: 'column',
		/* height: 'auto', */
		fontFamily: 'Lato',
		/* backgroundColor: '#a7aaa5', */
	},

	/* 	title: {
		text: 'asdf',
		style: {
			fontFamily: 'Lato',
			fontSize: '1.3rem',

			color: '#FF00FF',
		},
	}, */
	subtitle: {
		text: null,
	},
	xAxis: {
		categories: [],
		tickmarkPlacement: 'on',
		title: {
			text: null,
			style: {
				fontSize: '.9rem',
				fontFamily: 'Lato',
				color: 'red',
				textTransform: 'uppercase',
			},
		},
		labels: {
			enabled: true,
			style: {
				fontFamily: 'Lato',
				color: 'blue',
				textTransform: 'uppercase',
			},
		},
		crosshair: true,
	},
	yAxis: null,
	tooltip: {
		shared: true,
		useHTML: true,
		outside: true,
		zIndex: 999999,
		distance: 30, // Positive = right, Negative = left

		style: {
			fontFamily: 'Lato',
		},
		formatter: function () {
			let tooltip = `<div style="z-index:100000;display:grid; grid-template-columns:1fr;overflow:none;">
            <div  style="font-size:1.4rem" class="text-center w-full mb-2 background-color:${this.color}">${this.category}</div>

            `;
			this.points.forEach((point) => {
				console.log('point', point);
				//"name":"all_richness"
				let seriesName = point.series.name.split('_')[0];
				let seriesLabel = point.series.name.split('_')[1];
				switch (seriesLabel) {
					case 'richness':
						seriesLabel = 'Richness';
						break;
					case 'abundance':
						seriesLabel = 'Abundance';
						break;
				}
				switch (seriesName) {
					case 'u':
						seriesName = 'Uccelli';
						break;
					case 'o':
						seriesName = 'Ortotteri';
						break;
					case 'l':
						seriesName = 'Lepidotteri';
						break;
					case 'r':
						seriesName = 'Ragni';
						break;
					case 'c':
						seriesName = 'Carabidi';
						break;
					case 'f':
						seriesName = 'Formiche';
						break;
					case 's':
						seriesName = 'Stafilinidi';
						break;
					case 'all':
						seriesName = 'All taxa';
						break;
				}

				tooltip += `<div style="display:flex; flex-direction:row;align-items:center;">`;
				const value = point.y === 0 ? 'N/A' : point.y;
				tooltip += `<div class="mr-1 w-2 h-2 rounded-full" style="background-color:${point.color};"></div>
                                 <div> ${seriesName}: ${seriesLabel}



								 <b>${value}</b>
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
			borderRadius: 0,
			borderWidth: 0.5,
			borderColor: 'gray',
			cursor: 'pointer',
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
