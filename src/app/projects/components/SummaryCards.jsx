"use client";
import { useRouter } from "next/navigation";

export default function SummaryCards({ data }) {
  const router = useRouter();
  const { totalProjects, activeProjects, completedProjects, totalBudget, inProgressProjects, plannedProjects, onHoldProjects, cancelledProjects, totalActualCost, budgetVariance } = data;

  // Helper function to format Indian rupees
  const formatRupees = (amount) => {
    if (!amount || amount === 0) return '₹0';
    return '₹' + parseFloat(amount).toLocaleString('en-IN');
  };

  // Helper function to format budget with proper units
  const formatBudget = (amount) => {
    if (!amount || amount === 0) return '₹0';
    
    const absAmount = Math.abs(amount);
    const formatter = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 1,
      notation: 'compact',
      compactDisplay: 'short'
    });
    
    return `₹${formatter.format(absAmount)}`;
  };

  // Card data configuration
  const cards = [
    {
      title: "Total Projects",
      value: totalProjects || 0,
      icon: "📊",
      gradient: "from-blue-50 to-white",
      border: "border-blue-100",
      textColor: "text-blue-900",
      accentColor: "bg-blue-100",
      iconBg: "bg-blue-50",
      trend: totalProjects > 0 ? "+12%" : null, 
       path: "/projects" 
    },
    {
      title: "Active Projects",
      value: activeProjects || 0,
      icon: "⚡",
      gradient: "from-emerald-50 to-white",
      border: "border-emerald-100",
      textColor: "text-emerald-900",
      accentColor: "bg-emerald-100",
      iconBg: "bg-emerald-50",
      trend: activeProjects > 0 ? "+8%" : null,
      subItems: [
        { label: "In Progress", value: inProgressProjects, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Planned", value: plannedProjects, color: "text-blue-600", bg: "bg-blue-50" }
      ]
    },
    {
      title: "Budget",
      value: formatBudget(totalBudget),
      icon: "💰",
      gradient: "from-violet-50 to-white",
      border: "border-violet-100",
      textColor: "text-violet-900",
      accentColor: "bg-violet-100",
      iconBg: "bg-violet-50",
      trend: budgetVariance > 0 ? "📈 Over" : budgetVariance < 0 ? "📉 Under" : "⚖️ On Track",
      path: "/expenses",
    }
  ];

  // Status cards data
  const statusCards = [
    {
      id: 1,
      title: "Completed",
      value: completedProjects || 0,
      icon: "✅",
      gradient: "from-green-50 to-white",
      border: "border-green-100",
      textColor: "text-green-900",
      accentColor: "bg-green-100",
      description: "Successfully delivered",
      percentage: totalProjects > 0 ? ((completedProjects / totalProjects) * 100).toFixed(1) + "%" : "0%"
    },
    {
      id: 2,
      title: "On Hold",
      value: onHoldProjects || 0,
      icon: "⏸️",
      gradient: "from-amber-50 to-white",
      border: "border-amber-100",
      textColor: "text-amber-900",
      accentColor: "bg-amber-100",
      description: "Requires attention",
      percentage: activeProjects > 0 ? ((onHoldProjects / activeProjects) * 100).toFixed(1) + "%" : "0%"
    },
    {
      id: 3,
      title: "Cancelled",
      value: cancelledProjects || 0,
      icon: "📉",
      gradient: "from-rose-50 to-white",
      border: "border-rose-100",
      textColor: "text-rose-900",
      accentColor: "bg-rose-100",
      description: "Terminated projects",
      percentage: totalProjects > 0 ? ((cancelledProjects / totalProjects) * 100).toFixed(1) + "%" : "0%"
    }
  ].filter(card => card.value > 0);

  return (
    <div className="w-full space-y-4 md:space-y-6 mb-8 px-1 sm:px-2 md:px-4">
      {/* Main Cards Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
        {cards.map((card, index) => (
          <div 
            key={index}
            onClick={() => card.path && router.push(card.path)}
            className={`
              relative p-4 md:p-5 rounded-xl lg:rounded-2xl border 
              bg-gradient-to-br ${card.gradient} ${card.border}
              shadow-sm hover:shadow-md transition-all duration-300 
              hover:translate-y-[-2px] group ${card.path ? 'cursor-pointer' : 'cursor-default'}
              animate-fadeIn opacity-0
              min-h-[100px] sm:min-h-[110px] md:min-h-[120px]
            `}
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
          >
            {/* Animated Background Element */}
            <div className={`absolute top-0 right-0 w-12 h-12 md:w-14 md:h-14 ${card.accentColor} 
              rounded-bl-xl rounded-tr-xl opacity-0 group-hover:opacity-20 
              transition-all duration-500 transform rotate-0 group-hover:rotate-12`}></div>
            
            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-between">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-xs font-medium ${card.textColor} tracking-wide truncate uppercase`}>
                      {card.title}
                    </h3>
                    {card.trend && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${card.accentColor} ${card.textColor}`}>
                        {card.trend}
                      </span>
                    )}
                  </div>
                  <p className={`text-2xl md:text-3xl font-bold ${card.textColor} leading-tight`}>
                    {card.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {card.description}
                  </p>
                </div>
                
                {/* Icon with Animation */}
                <div className={`
                  p-2 md:p-2.5 rounded-lg ${card.iconBg} 
                  transition-all duration-300 group-hover:scale-110
                  flex-shrink-0
                `}>
                  <span className="text-lg md:text-xl">{card.icon}</span>
                </div>
              </div>

              {/* Sub-items for Active Projects */}
              {card.subItems && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {card.subItems.map((item, idx) => (
                    item.value > 0 && (
                      <span 
                        key={idx}
                        className={`
                          text-xs font-medium px-2 py-1 rounded-full ${item.bg} ${item.color}
                          border border-opacity-20 ${item.bg.replace('bg-', 'border-')}
                          transition-all duration-300 hover:scale-105
                        `}
                      >
                        {item.value} {item.label}
                      </span>
                    )
                  ))}
                </div>
              )}

              {/* Financial Data for Budget Card */}
              {card.financialData && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Actual Cost</span>
                    <span className="font-medium text-gray-700">
                      {formatBudget(card.financialData.actualCost)}
                    </span>
                  </div>
                  {card.financialData.variance !== 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Variance</span>
                      <span className={`font-medium ${
                        card.financialData.variance > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {card.financialData.variance > 0 ? '+' : ''}
                        {formatBudget(card.financialData.variance)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Progress Bar for Completion Rate */}
              {card.title === "Total Projects" && totalProjects > 0 && completedProjects > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Completion Rate</span>
                    <span className="font-semibold text-emerald-600">
                      {((completedProjects / totalProjects) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-700 ease-out"
                      style={{ 
                        width: `${(completedProjects / totalProjects) * 100}%`,
                        animation: 'slideIn 0.7s ease-out'
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Status Cards - Only show if any exist */}
      {statusCards.length > 0 && (
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          {statusCards.map((card, index) => (
            <div 
              key={card.id}
              className={`
                relative p-4 md:p-5 rounded-xl lg:rounded-2xl border 
                bg-gradient-to-br ${card.gradient} ${card.border}
                shadow-sm hover:shadow-md transition-all duration-300 
                hover:translate-y-[-2px] group cursor-pointer
                animate-fadeIn opacity-0
                min-h-[90px] sm:min-h-[100px] md:min-h-[110px]
              `}
              style={{ animationDelay: `${400 + index * 100}ms`, animationFillMode: 'forwards' }}
            >
              {/* Content */}
              <div className="flex items-center justify-between h-full">
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-xs font-medium ${card.textColor} tracking-wide truncate uppercase`}>
                      {card.title}
                    </h3>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${card.accentColor} ${card.textColor}`}>
                      {card.percentage}
                    </span>
                  </div>
                  <p className={`text-2xl md:text-3xl font-bold ${card.textColor} mb-1`}>
                    {card.value}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {card.description}
                  </p>
                </div>
                
                {/* Icon */}
                <div className={`
                  p-2 md:p-2.5 rounded-lg ${card.iconBg}
                  transition-all duration-300 group-hover:scale-110
                  flex-shrink-0
                `}>
                  <span className="text-lg md:text-xl">{card.icon}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      card.title === "Completed" ? "bg-gradient-to-r from-green-400 to-green-500" :
                      card.title === "On Hold" ? "bg-gradient-to-r from-amber-400 to-amber-500" :
                      "bg-gradient-to-r from-rose-400 to-rose-500"
                    }`}
                    style={{ 
                      width: card.percentage,
                      animation: 'slideIn 0.7s ease-out'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Animation Keyframes */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideIn {
          from {
            width: 0;
          }
          to {
            width: var(--target-width);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}